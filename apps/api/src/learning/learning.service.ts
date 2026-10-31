import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { MasteryService, normaliseAnswerToOptionText } from '../diagnosis/mastery.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StudentGradeAccessService } from '../common/services/student-grade-access.service';
import { ContentScopeService } from '../common/content/content-scope.service';
import { canonicalContentType } from '../common/content/content-types';
import { normalizeChapterSegments, deriveConceptSegments, clipSegmentsToDuration } from '../common/books/chapter-segments';
import { chapterPdfPath, chapterPdfFileName, chapterPdfRemoteUrl } from '../common/books/chapter-pdf';
import { chapterPageFiles } from '../common/books/chapter-pages';
import { parseYouTubeVideoId, youtubeThumbnailUrl } from '../curriculum/content.service';
import { awardStudentXp, XP_PER_PRACTICE_CORRECT, XP_PRACTICE_COMPLETION } from '../common/xp';
import { Prisma } from '@prisma/client';

/** The API prefix every chapter PDF link is built with. */
const API_PREFIX = '/api/v1';

/** The mastery levels that count as "learned" for the chapter progress bar. */
const MASTERED_LEVELS = new Set(['MASTERED', 'GOOD']);

/**
 * The number a student reads on the chapter ("Chapter 4").
 *
 * `Chapter.order` is the source of truth, but every chapter created before the
 * seed started writing it holds 0, and the code is the only other curriculum
 * numbering that survives: `SCI-10-4` and `MAT-8P2-3` both end in their own
 * book's chapter number. Falling back to the position in the ordered list keeps
 * a hand-created chapter sane instead of printing "Chapter 0".
 */
function curriculumNumber(order: number | null | undefined, code: string | null | undefined, index: number): number {
  if (typeof order === 'number' && order > 0) return order;
  const fromCode = /-(\d+)$/.exec(code ?? '');
  if (fromCode) {
    const parsed = Number(fromCode[1]);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return index + 1;
}

/** The most questions a single practice set may hold. */
const PRACTICE_QUESTION_LIMIT = 20;

/** The fewest questions a single practice set may hold. */
const PRACTICE_QUESTION_MIN = 1;

/** The default size of a concept practice set. */
const DEFAULT_PRACTICE_QUESTIONS = 5;

/** The default size of a chapter practice set. */
const DEFAULT_CHAPTER_PRACTICE_QUESTIONS = 10;

/**
 * Ready-made exams generated from the question bank. A class always has a Term 1,
 * a Term 2 and a class test per subject without waiting for a teacher to author
 * one. The key is stable, so the same exam is the same paper for everyone.
 */
const EXAM_BLUEPRINTS = [
  { key: 'term-1', label: 'Term 1', questions: 20, durationMinutes: 30 },
  { key: 'term-2', label: 'Term 2', questions: 20, durationMinutes: 30 },
  { key: 'class-test', label: 'Class test', questions: 10, durationMinutes: 15 },
] as const;

/**
 * Where a concept sits inside the chapter's video, so the hub can print
 * "12:30 - 18:05" and the client can open the concept with the video already
 * playing at that point. Derived from the same markers the player renders, so
 * the row and the marker strip can never disagree.
 */
export interface ConceptSection {
  contentId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  derived: boolean;
}

/** Segment titles and concept names must match on words, not punctuation. */
function normalizeSectionTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** The part of a chapter video the hub needs in order to place a concept. */
export interface SectionVideo {
  contentId: string;
  conceptId: string | null;
  durationSeconds: number | null;
  segments: Array<{ title: string; startSeconds: number; derived?: boolean }>;
}

/**
 * Map every concept to the slice of the chapter's video that teaches it.
 *
 * Two passes, because a chapter can carry both a short lesson and a long
 * compilation that belongs to a single concept:
 *  1. markers that name a concept (creator chapters by title, or the derived
 *     concept split by position),
 *  2. only then, a concept-owned video lesson (the whole clip is that part).
 *
 * Doing the whole-clip fallback last is what stops a 4-hour compilation from
 * claiming a concept that a 38-minute lesson already covers at 00:00-09:38.
 * A concept with no marker at all gets `null`: the hub prints no times rather
 * than inventing a range.
 */
export function buildConceptSections(
  videos: SectionVideo[],
  concepts: Array<{ id: string; name: string }>,
): Map<string, ConceptSection> {
  const sections = new Map<string, ConceptSection>();
  const idByName = new Map<string, string>();
  for (const concept of concepts) {
    const key = normalizeSectionTitle(concept.name);
    if (key && !idByName.has(key)) idByName.set(key, concept.id);
  }

  const runtime = (video: SectionVideo): number | null =>
    typeof video.durationSeconds === 'number' &&
    Number.isFinite(video.durationSeconds) &&
    video.durationSeconds > 0
      ? video.durationSeconds
      : null;

  for (const video of videos) {
    const duration = runtime(video);
    const segments = video.segments ?? [];
    const derivedOnly = segments.length > 0 && segments.every((segment) => segment.derived === true);

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const next = segments[index + 1];
      const start = segment.startSeconds;
      const end = next ? next.startSeconds : duration && duration > start ? duration : start;
      const section: ConceptSection = {
        contentId: video.contentId,
        startSeconds: start,
        endSeconds: Math.max(start, end),
        durationSeconds: Math.max(0, end - start),
        derived: segment.derived === true,
      };

      const byTitle = idByName.get(normalizeSectionTitle(segment.title));
      if (byTitle && !sections.has(byTitle)) sections.set(byTitle, section);

      if (derivedOnly && segments.length === concepts.length) {
        const byIndex = concepts[index]?.id;
        if (byIndex && !sections.has(byIndex)) sections.set(byIndex, section);
      }
    }
  }

  for (const video of videos) {
    if (!video.conceptId || sections.has(video.conceptId)) continue;
    const duration = runtime(video);
    sections.set(video.conceptId, {
      contentId: video.contentId,
      startSeconds: 0,
      endSeconds: duration ?? 0,
      durationSeconds: duration ?? 0,
      derived: false,
    });
  }

  return sections;
}

/**
 * The client picks how many questions it wants, so the number is clamped to a
 * sane range: a request for 100000 questions would otherwise load the whole
 * question bank into a practice set.
 */
export function clampQuestionCount(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), PRACTICE_QUESTION_MIN), PRACTICE_QUESTION_LIMIT);
}

/**
 * Pushes every heading of a markdown body down by `levels`, so a lesson that
 * uses `##` inside the chapter summary nests under the section it belongs to
 * instead of breaking out of it.
 */
function demoteHeadings(markdown: string, levels = 1): string {
  return markdown.replace(/^(#{1,5})(\s+)/gm, (_match, hashes: string, space: string) => {
    const next = '#'.repeat(Math.min(6, hashes.length + levels));
    return `${next}${space}`;
  });
}


const LEADERBOARD_PERIOD_DAYS: Record<string, number | null> = {
  weekly: 7,
  monthly: 30,
  all: null,
  alltime: null,
  'all-time': null,
};

/** Start of the current calendar week (Monday, local time) - "This Week" means this week. */
function startOfCurrentWeek(reference = new Date()): Date {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday-based
  start.setDate(start.getDate() - diff);
  return start;
}

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly mastery: MasteryService,
    private readonly identity: StudentIdentityService,
    private readonly gradeAccess: StudentGradeAccessService,
    private readonly scope: ContentScopeService,
  ) {}

  private consumerWhere(user: RequestUser, extra: Prisma.ContentItemWhereInput = {}): Prisma.ContentItemWhereInput {
    return { ...extra, ...this.scope.buildContentWhere(user) };
  }

  private requireBrowseContext(user: RequestUser): string | null {
    if (!user.institutionId) return null;
    return this.tenant.requireInstitution(user);
  }

  async getLearningHome(user: RequestUser) {
    // A student may be enrolled in several classes (or in all of them), so the
    // home lists every class they can open - the clients already render whatever
    // grades come back.
    const access = await this.gradeAccess.forUser(user);

    const boards = await this.prisma.board.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        grades: { orderBy: { order: 'asc' } },
        subjects: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Count content per subject per grade through chapters
    const allApprovedContent = await this.prisma.contentItem.findMany({
      where: this.consumerWhere(user, {
        subjectId: { not: null },
        chapterId: { not: null },
      }),
      select: { id: true, subjectId: true, chapterId: true },
    });

    // Map chapterId → grade
    const chapterIds = [...new Set(allApprovedContent.map((c) => c.chapterId!))];
    const chapters = await this.prisma.chapter.findMany({
      where: { id: { in: chapterIds } },
      select: { id: true, grade: true },
    });
    const chapterGradeMap = new Map(chapters.map((c) => [c.id, c.grade]));

    // Count total content per subject per grade
    const subjectGradeCountMap = new Map<string, number>();
    for (const item of allApprovedContent) {
      const grade = chapterGradeMap.get(item.chapterId!);
      if (grade) {
        const key = `${item.subjectId}|${grade}`;
        subjectGradeCountMap.set(key, (subjectGradeCountMap.get(key) ?? 0) + 1);
      }
    }

    // Count completed content
    const completedCounts = await this.prisma.contentProgress.groupBy({
      by: ['contentId'],
      where: {
        state: 'COMPLETED',
        content: this.consumerWhere(user, {
          subjectId: { not: null },
        }),
      },
      _count: { id: true },
    });

    // Count completed content per subject per grade
    const completedByContent = new Map<string, number>();
    for (const c of completedCounts) {
      completedByContent.set(c.contentId, c._count.id);
    }

    const subjectGradeCompletedMap = new Map<string, number>();
    for (const item of allApprovedContent) {
      const grade = chapterGradeMap.get(item.chapterId!);
      if (grade && completedByContent.has(item.id)) {
        const key = `${item.subjectId}|${grade}`;
        subjectGradeCompletedMap.set(key, (subjectGradeCompletedMap.get(key) ?? 0) + 1);
      }
    }

    // Get subjects for grade filtering
    const subjects = await this.prisma.subject.findMany({
      where: { active: true },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);

    // Get mastery per subject per grade
    const student = await this.identity.resolveForUser(user);
    let averageMasteryMap = new Map<string, number>();
    if (student) {
      const masteryByConcept = await this.prisma.conceptMastery.findMany({
        where: { studentId: student.id },
        select: { conceptId: true, score: true },
      });
      const conceptIds = masteryByConcept.map((m) => m.conceptId);
      if (conceptIds.length > 0) {
        const conceptTopics = await this.prisma.concept.findMany({
          where: { id: { in: conceptIds } },
          select: { id: true, topic: { select: { chapter: { select: { subjectId: true, grade: true } } } } },
        });
        for (const m of masteryByConcept) {
          const c = conceptTopics.find((ct) => ct.id === m.conceptId);
          if (c) {
            const key = `${c.topic.chapter.subjectId}|${c.topic.chapter.grade}`;
            const scores: number[] = averageMasteryMap.has(key) ? [] : [];
            // We'll aggregate below
          }
        }
        // Simple approach: group by subject+grade
        const scoreMap = new Map<string, number[]>();
        for (const m of masteryByConcept) {
          const c = conceptTopics.find((ct) => ct.id === m.conceptId);
          if (c) {
            const key = `${c.topic.chapter.subjectId}|${c.topic.chapter.grade}`;
            if (!scoreMap.has(key)) scoreMap.set(key, []);
            scoreMap.get(key)!.push(m.score);
          }
        }
        for (const [key, scores] of scoreMap) {
          averageMasteryMap.set(key, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
        }
      }
    }

    return {
      // Which classes the home is showing, so a client can label the grid
      // ("Class 10" / "Classes 8 and 10" / "All classes").
      studentGrades: access.grades,
      allGrades: access.unrestricted,
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        grades: b.grades
          .filter((g) => this.gradeAccess.allows(access, g.name))
          .map((g) => ({
          id: g.id,
          grade: g.name,
          boardId: b.id,
          subjects: b.subjects
            .filter((s) => subjectGradeCountMap.has(`${s.id}|${g.name}`))
            .map((s) => {
              const key = `${s.id}|${g.name}`;
              return {
                id: s.id,
                name: s.name,
                code: s.code,
                gradeId: g.id,
                completedContent: subjectGradeCompletedMap.get(key) ?? 0,
                totalContent: subjectGradeCountMap.get(key) ?? 0,
                averageMastery: averageMasteryMap.get(key) ?? 0,
              };
            }),
        })),
      })),
    };
  }

  async getChapters(user: RequestUser, boardId: string, grade: string, subjectId: string) {
    this.requireBrowseContext(user);

    // A student may be enrolled in several classes; any of them may be opened.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), grade);

    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, boardId, active: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const chapters = await this.prisma.chapter.findMany({
      where: { subjectId, grade },
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
      include: {
        topics: {
          orderBy: { order: 'asc' },
          include: { concepts: { orderBy: { order: 'asc' }, select: { id: true } } },
        },
      },
    });

    // Number every chapter once, from `order` or its own code, and sort by that
    // number: with legacy rows (order = 0) the database order is arbitrary.
    const orderedChapters = chapters
      .map((chapter, index) => ({ chapter, number: curriculumNumber(chapter.order, chapter.code, index) }))
      .sort((a, b) => a.number - b.number || a.chapter.code.localeCompare(b.chapter.code));

    const chapterIds = chapters.map((c) => c.id);

    const contentByChapter = await this.prisma.contentItem.groupBy({
      by: ['chapterId'],
      where: this.consumerWhere(user, {
        chapterId: { in: chapterIds },
      }),
      _count: { id: true },
    });

    const contentCountMap = new Map(
      contentByChapter.map((c) => [c.chapterId, c._count.id]),
    );

    const allChapterContent = await this.prisma.contentItem.findMany({
      where: this.consumerWhere(user, {
        chapterId: { in: chapterIds },
      }),
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        chapterId: true,
        type: true,
        url: true,
        videoId: true,
        thumbnailUrl: true,
      },
    });

    // A chapter card uses the chapter's own first video frame - a real image of
    // the lesson the student is about to open, not a stock photo.
    const thumbnailByChapter = new Map<string, string>();
    for (const item of allChapterContent) {
      if (!item.chapterId || thumbnailByChapter.has(item.chapterId)) continue;
      if (canonicalContentType(item.type) !== 'VIDEO') continue;
      const videoId = item.videoId ?? parseYouTubeVideoId(item.url ?? '');
      const thumbnail = item.thumbnailUrl ?? (videoId ? youtubeThumbnailUrl(videoId) : null);
      if (thumbnail) thumbnailByChapter.set(item.chapterId, thumbnail);
    }

    const student = await this.identity.resolveForUser(user);

    let completedSet = new Set<string>();
    if (student) {
      const allContentIds = allChapterContent.map((c) => c.id);
      if (allContentIds.length > 0) {
        const completed = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: allContentIds },
            state: 'COMPLETED',
          },
          select: { contentId: true },
        });
        completedSet = new Set(completed.map((c) => c.contentId));
      }
    }

    const completedByChapter = new Map<string, number>();
    for (const item of allChapterContent) {
      if (item.chapterId && completedSet.has(item.id)) {
        completedByChapter.set(
          item.chapterId,
          (completedByChapter.get(item.chapterId) ?? 0) + 1,
        );
      }
    }

    // Get mastery for all concepts in these chapters
    const allConceptIds = chapters.flatMap((c) => c.topics.flatMap((t) => t.concepts.map((co) => co.id)));
    let masteryByConcept = new Map<string, number>();
    if (student && allConceptIds.length > 0) {
      const masteryRecords = await this.prisma.conceptMastery.findMany({
        where: { studentId: student.id, conceptId: { in: allConceptIds } },
        select: { conceptId: true, score: true },
      });
      for (const m of masteryRecords) {
        masteryByConcept.set(m.conceptId, m.score);
      }
    }

    return {
      subject: { id: subject.id, name: subject.name, code: subject.code },
      grade,
      chapters: orderedChapters.map(({ chapter: c, number }) => {
        const total = contentCountMap.get(c.id) ?? 0;
        const completed = completedByChapter.get(c.id) ?? 0;
        const conceptIds = c.topics.flatMap((t) => t.concepts.map((co) => co.id));
        const masteryScores = conceptIds.map((id) => masteryByConcept.get(id)).filter((s): s is number => s != null);
        const avgMastery = masteryScores.length > 0 ? Math.round(masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length) : 0;
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          order: number,
          description: c.description,
          topicCount: c.topics.length,
          conceptCount: c.topics.reduce((a, t) => a + t.concepts.length, 0),
          totalContent: total,
          completedContent: completed,
          percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
          averageMastery: avgMastery,
          thumbnailUrl: thumbnailByChapter.get(c.id) ?? null,
        };
      }),
    };
  }

  async getChapterDetail(user: RequestUser, chapterId: string) {
    this.requireBrowseContext(user);

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topics: {
          orderBy: { order: 'asc' },
          include: {
            concepts: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    // A student may be enrolled in several classes; any of them may be opened.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), chapter.grade);

    const conceptIds = chapter.topics.flatMap((t) => t.concepts.map((c) => c.id));

    // Every content item of the chapter: the chapter-scoped ones and the ones
    // that hang off its concepts.
    const items = await this.prisma.contentItem.findMany({
      where: this.consumerWhere(user, { chapterId }),
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        conceptId: true,
        type: true,
        title: true,
        description: true,
        url: true,
        videoId: true,
        thumbnailUrl: true,
        durationSeconds: true,
        order: true,
        segments: true,
      },
    });

    const chapterContent = items.filter((item) => item.conceptId === null);

    const contentByConcept = new Map<string, number>();
    const itemsByConcept = new Map<string, typeof items>();
    const videoConceptIds = new Set<string>();
    const allContentIds: string[] = [];
    for (const item of items) {
      allContentIds.push(item.id);
      if (!item.conceptId) continue;
      contentByConcept.set(
        item.conceptId,
        (contentByConcept.get(item.conceptId) ?? 0) + 1,
      );
      const bucket = itemsByConcept.get(item.conceptId);
      if (bucket) bucket.push(item);
      else itemsByConcept.set(item.conceptId, [item]);
      if (canonicalContentType(item.type) === 'VIDEO') videoConceptIds.add(item.conceptId);
    }

    const student = await this.identity.resolveForUser(user);

    let completedByConcept = new Map<string, number>();
    let masteryMap = new Map<string, { score: number; level: string; attempts: number; correct: number }>();

    if (student) {
      if (allContentIds.length > 0) {
        const completed = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: allContentIds },
            state: 'COMPLETED',
          },
          select: { contentId: true },
        });
        const completedSet = new Set(completed.map((c) => c.contentId));
        for (const item of items) {
          if (item.conceptId && completedSet.has(item.id)) {
            completedByConcept.set(
              item.conceptId,
              (completedByConcept.get(item.conceptId) ?? 0) + 1,
            );
          }
        }
      }

      if (conceptIds.length > 0) {
        const mastery = await this.prisma.conceptMastery.findMany({
          where: { studentId: student.id, conceptId: { in: conceptIds } },
          select: { conceptId: true, score: true, level: true, attempts: true, correct: true },
        });
        for (const m of mastery) {
          masteryMap.set(m.conceptId, { score: m.score, level: m.level, attempts: m.attempts, correct: m.correct });
        }
      }
    }

    let conceptPosition = 0;
    const concepts = chapter.topics.flatMap((t) =>
      t.concepts.map((c) => {
        conceptPosition += 1;
        const total = contentByConcept.get(c.id) ?? 0;
        const completed = completedByConcept.get(c.id) ?? 0;
        const status = total > 0 && completed >= total ? 'COMPLETED' : completed > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
        return {
          id: c.id,
          name: c.name,
          // The position in the chapter, not in its topic: the Contents list is
          // flat, and per-topic numbering repeats 1,2,1,2 down the page.
          order: conceptPosition,
          description: c.description,
          topicId: t.id,
          topicName: t.name,
          totalContent: total,
          completedContent: completed,
          mastery: masteryMap.get(c.id) ?? null,
          hasVideo: videoConceptIds.has(c.id),
          status,
        };
      }),
    );

    const videos = items
      .filter((item) => canonicalContentType(item.type) === 'VIDEO')
      .map((item) => {
        const videoId = item.videoId ?? parseYouTubeVideoId(item.url ?? '');
        const stored = normalizeChapterSegments(item.segments);
        return {
          contentId: item.id,
          conceptId: item.conceptId,
          title: item.title,
          videoId,
          url: item.url ?? (videoId ? `https://www.youtube.com/embed/${videoId}` : null),
          thumbnailUrl: item.thumbnailUrl ?? (videoId ? youtubeThumbnailUrl(videoId) : null),
          durationSeconds: item.durationSeconds,
          // Real creator chapters win; otherwise the chapter's concepts give the
          // student a way to jump, flagged as derived.
          segments: clipSegmentsToDuration(
            stored.length > 0
              ? stored
              : deriveConceptSegments(
                  concepts.map((c) => c.name),
                  item.durationSeconds,
                ),
            item.durationSeconds,
          ),
        };
      });

    // The concept -> video-section map is built from the SAME marker list the
    // player renders, so "12:30 - 18:05" on a concept row is exactly what the
    // marker strip shows (real creator chapters when they exist, the derived
    // concept split otherwise).
    const sectionByConcept = buildConceptSections(videos, concepts);

    const questionCount = conceptIds.length
      ? await this.prisma.question.count({
          where: { conceptId: { in: conceptIds }, status: 'APPROVED' },
        })
      : 0;

    const mastered = concepts.filter((c) => c.mastery && MASTERED_LEVELS.has(c.mastery.level)).length;

    return {
      id: chapter.id,
      name: chapter.name,
      code: chapter.code,
      grade: chapter.grade,
      order: curriculumNumber(chapter.order, chapter.code, 0),
      description: chapter.description,
      // The subject NAME, so a client can print it directly ("Science - Class 10").
      // The structured subject stays available under `subjectInfo`.
      subject: chapter.subject.name,
      subjectInfo: chapter.subject,
      subjectName: chapter.subject.name,
      summary: this.buildChapterSummary(chapter, items, concepts, itemsByConcept, masteryMap),
      pdfUrl: chapterPdfPath(chapter.code) ? `${API_PREFIX}/learning/chapters/${chapter.id}/pdf` : null,
      externalPdfUrl: chapterPdfPath(chapter.code) ? null : chapterPdfRemoteUrl(chapter.code),
      chapterContent,
      concepts: concepts.map((c) => ({
        ...c,
        section: sectionByConcept.get(c.id) ?? null,
      })),
      videos,
      progress: {
        concepts: concepts.length,
        mastered,
        videos: videos.length,
        percent: concepts.length > 0 ? Math.round((mastered / concepts.length) * 100) : 0,
      },
      practice: {
        questionCount,
        available: questionCount > 0,
      },
      topics: chapter.topics.map((t) => ({
        id: t.id,
        name: t.name,
        order: t.order,
        concepts: t.concepts.map((c) => {
          const concept = concepts.find((entry) => entry.id === c.id);
          return {
            id: c.id,
            name: c.name,
            order: concept?.order ?? c.order,
            description: c.description,
            totalContent: concept?.totalContent ?? 0,
            completedContent: concept?.completedContent ?? 0,
            mastery: masteryMap.get(c.id) ?? null,
            section: sectionByConcept.get(c.id) ?? null,
          };
        }),
      })),
    };
  }

  /**
   * The chapter notes: the chapter description plus the markdown of every NOTES
   * lesson of the chapter and of its concepts (one section per concept, with
   * the student's mastery on it). `null` when the chapter has no notes at all.
   */
  private buildChapterSummary(
    chapter: { description: string | null },
    chapterItems: Array<{ type: string; title: string; description: string | null; conceptId: string | null }>,
    concepts: Array<{ id: string; name: string }>,
    itemsByConcept: Map<string, Array<{ type: string; title: string; description: string | null }>>,
    masteryMap: Map<string, { score: number; level: string; attempts: number; correct: number }>,
  ): string | null {
    const blocks: string[] = [];

    if (chapter.description?.trim()) blocks.push(chapter.description.trim());

    const chapterNotes = chapterItems.filter(
      (item) => !item.conceptId && canonicalContentType(item.type) === 'NOTES' && item.description?.trim(),
    );
    for (const note of chapterNotes) {
      blocks.push(`## ${note.title}\n\n${demoteHeadings(note.description!.trim())}`);
    }

    for (const concept of concepts) {
      const items = itemsByConcept.get(concept.id) ?? [];
      const notes = items.filter(
        (item) => canonicalContentType(item.type) === 'NOTES' && item.description?.trim(),
      );
      if (notes.length === 0) continue;

      const mastery = masteryMap.get(concept.id);
      const level = mastery ? mastery.level.replace(/_/g, ' ').toLowerCase() : 'not started';
      const score = mastery ? ` (${mastery.score}%)` : '';
      blocks.push(`## ${concept.name} — mastery: ${level}${score}`);
      for (const note of notes) {
        blocks.push(`### ${note.title}\n\n${demoteHeadings(note.description!.trim(), 2)}`);
      }
    }

    if (blocks.length === 0) return null;
    return blocks.join('\n\n');
  }

async getConceptDetail(user: RequestUser, conceptId: string) {
    this.requireBrowseContext(user);
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        topic: {
          include: {
            chapter: {
              select: {
                id: true,
                name: true,
                grade: true,
                code: true,
                subject: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
    });
    if (!concept) throw new NotFoundException('Concept not found');

    // A student may be enrolled in several classes; any of them may be opened.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), concept.topic.chapter.grade);

    const contentSelect = {
      id: true,
      type: true,
      title: true,
      description: true,
      durationSeconds: true,
      thumbnailUrl: true,
      url: true,
      videoId: true,
      language: true,
      segments: true,
    } as const;

    let contentSource: 'concept' | 'chapter' = 'concept';
    let contentItems = await this.prisma.contentItem.findMany({
      where: this.consumerWhere(user, { conceptId }),
      orderBy: { createdAt: 'asc' },
      select: contentSelect,
    });

    // A concept with no lesson of its own must not render an empty Learn tab:
    // fall back to the chapter's lessons (the same videos and notes the chapter
    // hub shows) and say that the content is chapter-level.
    if (contentItems.length === 0) {
      contentItems = await this.prisma.contentItem.findMany({
        where: this.consumerWhere(user, { chapterId: concept.topic.chapter.id }),
        orderBy: { createdAt: 'asc' },
        select: contentSelect,
      });
      if (contentItems.length > 0) contentSource = 'chapter';
    }

    const student = await this.identity.resolveForUser(user);

    let progressMap = new Map<string, { state: string; secondsWatched: number | null; completedAt: Date | null }>();
    let mastery: { score: number; level: string; attempts: number; correct: number; evidenceCount: number } | null = null;

    if (student) {
      if (contentItems.length > 0) {
        const progress = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: contentItems.map((c) => c.id) },
          },
          select: { contentId: true, state: true, secondsWatched: true, completedAt: true },
        });
        for (const p of progress) {
          progressMap.set(p.contentId, { state: p.state, secondsWatched: p.secondsWatched, completedAt: p.completedAt });
        }
      }

      const m = await this.prisma.conceptMastery.findUnique({
        where: { studentId_conceptId: { studentId: student.id, conceptId } },
        select: { score: true, level: true, attempts: true, correct: true, evidenceCount: true },
      });
      if (m) {
        mastery = { score: m.score, level: m.level, attempts: m.attempts, correct: m.correct, evidenceCount: m.evidenceCount };
      }
    }

    const practiceQuestions = await this.prisma.question.findMany({
      where: { conceptId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        difficulty: true,
        text: true,
        answer: true,
        explanation: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true, isCorrect: true } },
      },
    });

    // A lesson video rarely carries creator chapters, so the concept split is
    // derived from the chapter's concepts. Only queried when a video actually
    // needs it, so the happy path costs nothing.
    const needsDerivedSplit = contentItems.some(
      (item) =>
        canonicalContentType(item.type) === 'VIDEO' &&
        normalizeChapterSegments(item.segments).length === 0,
    );
    const chapterConceptNames = needsDerivedSplit
      ? (
          await this.prisma.topic.findMany({
            where: { chapterId: concept.topic.chapter.id },
            orderBy: { order: 'asc' },
            select: { concepts: { orderBy: { order: 'asc' }, select: { name: true } } },
          })
        ).flatMap((topic) => topic.concepts.map((c) => c.name))
      : [];

    return {
      id: concept.id,
      name: concept.name,
      description: concept.description,
      order: concept.order,
      topic: { id: concept.topic.id, name: concept.topic.name },
      chapter: concept.topic.chapter,
      contentSource,
      content: contentItems.map((item) => {
        const stored = normalizeChapterSegments(item.segments);
        return {
          ...item,
          segments: clipSegmentsToDuration(
            stored.length > 0
              ? stored
              : canonicalContentType(item.type) === 'VIDEO'
                ? deriveConceptSegments(chapterConceptNames, item.durationSeconds)
                : [],
            item.durationSeconds,
          ),
          progress: progressMap.get(item.id) ?? { state: 'NOT_STARTED', secondsWatched: null, completedAt: null },
        };
      }),
      mastery,
      practiceQuestions,
    };
  }

  async completeContent(user: RequestUser, contentId: string) {
    this.tenant.requireInstitution(user);

    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Content not found');

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can track learning progress');

    // Completing a lesson of another class would show up in this student's
    // progress and mastery, so the class check applies here too.
    const grade =
      content.grade ??
      (content.chapterId
        ? (await this.prisma.chapter.findUnique({ where: { id: content.chapterId }, select: { grade: true } }))
            ?.grade
        : null);
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), grade);

    const result = await this.prisma.contentProgress.upsert({
      where: { contentId_studentId: { contentId, studentId: student.id } },
      create: {
        contentId,
        studentId: student.id,
        state: 'COMPLETED',
        completedAt: new Date(),
      },
      update: {
        state: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return { ok: true, progress: result };
  }

  async uncompleteContent(user: RequestUser, contentId: string) {
    this.tenant.requireInstitution(user);

    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      select: { id: true },
    });
    if (!content) throw new NotFoundException('Content not found');

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can track learning progress');

    await this.prisma.contentProgress.updateMany({
      where: { contentId, studentId: student.id },
      data: { state: 'NOT_STARTED', completedAt: null },
    });

    const progress = await this.prisma.contentProgress.findUnique({
      where: { contentId_studentId: { contentId, studentId: student.id } },
    });

    return { ok: true, progress };
  }

  async getLearningProgress(user: RequestUser) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can track learning progress');

    // With several classes enrolled, the denominator counts only the classes
    // this student actually reads (all of them when unrestricted).
    const access = await this.gradeAccess.forUser(user);
    const gradeFilter: Prisma.ContentItemWhereInput = access.unrestricted
      ? {}
      : { OR: [{ grade: { in: access.grades } }, { chapter: { grade: { in: access.grades } } }] };

    const [totalContent, completedProgress, masterySummary] = await Promise.all([
      this.prisma.contentItem.count({
        where: this.consumerWhere(user, { subjectId: { not: null }, ...gradeFilter }),
      }),
      this.prisma.contentProgress.findMany({
        where: { studentId: student.id, state: 'COMPLETED' },
        select: { contentId: true, completedAt: true },
      }),
      this.prisma.conceptMastery.aggregate({
        where: { studentId: student.id },
        _avg: { score: true },
        _count: { id: true },
      }),
    ]);

    const completedSet = new Set(completedProgress.map((p) => p.contentId));
    const completedContent = completedSet.size;

    const levelCounts = await this.prisma.conceptMastery.groupBy({
      by: ['level'],
      where: { studentId: student.id },
      _count: { id: true },
    });

    const masteryByLevel: Record<string, number> = {};
    for (const l of levelCounts) {
      masteryByLevel[l.level] = l._count.id;
    }

    const recentActivity = await this.prisma.contentProgress.findMany({
      where: { studentId: student.id, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        content: { select: { id: true, title: true, type: true, subjectId: true, chapterId: true, conceptId: true } },
      },
    });

    return {
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        grades: access.grades,
        allGrades: access.unrestricted,
      },
      contentProgress: {
        totalContent,
        completedContent,
        percentComplete: totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0,
      },
      mastery: {
        averageScore: masterySummary._avg.score ?? 0,
        totalConcepts: masterySummary._count.id,
        byLevel: masteryByLevel,
      },
      recentActivity: recentActivity.map((r) => ({
        contentId: r.contentId,
        title: r.content.title,
        type: r.content.type,
        completedAt: r.completedAt,
      })),
    };
  }

  async getLearningPath(user: RequestUser) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students have a learning path');

    // The path spans every class the student is enrolled in (all classes when
    // the account is unrestricted).
    const access = await this.gradeAccess.forUser(user);

    const [rawConcepts, masteryRows] = await Promise.all([
      this.prisma.concept.findMany({
        where: access.unrestricted ? {} : { topic: { chapter: { grade: { in: access.grades } } } },
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              order: true,
              chapter: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                  grade: true,
                  subjectId: true,
                  subject: { select: { id: true, name: true, order: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.conceptMastery.findMany({
        where: { studentId: student.id },
        select: {
          conceptId: true,
          score: true,
          level: true,
          attempts: true,
          correct: true,
          evidenceCount: true,
          lastUpdatedAt: true,
        },
      }),
    ]);

    const ordered = [...rawConcepts].sort((a, b) => {
      if (a.topic.chapter.subject.order !== b.topic.chapter.subject.order)
        return a.topic.chapter.subject.order - b.topic.chapter.subject.order;
      if (a.topic.chapter.order !== b.topic.chapter.order)
        return a.topic.chapter.order - b.topic.chapter.order;
      if (a.topic.order !== b.topic.order) return a.topic.order - b.topic.order;
      return a.order - b.order;
    });

    const masteryByConcept = new Map(masteryRows.map((m) => [m.conceptId, m]));

    const track = ordered.map((c, index) => {
      const m = masteryByConcept.get(c.id);
      const state: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' = !m
        ? 'NOT_STARTED'
        : m.level === 'MASTERED' || m.level === 'GOOD'
          ? 'DONE'
          : 'IN_PROGRESS';
      return {
        index,
        conceptId: c.id,
        conceptName: c.name,
        topicId: c.topic.id,
        topicName: c.topic.name,
        topicOrder: c.topic.order,
        chapterId: c.topic.chapter.id,
        chapterName: c.topic.chapter.name,
        chapterOrder: c.topic.chapter.order,
        subjectId: c.topic.chapter.subjectId,
        subjectName: c.topic.chapter.subject.name,
        subjectOrder: c.topic.chapter.subject.order,
        grade: c.topic.chapter.grade,
        order: c.order,
        level: (m?.level ?? 'INSUFFICIENT_EVIDENCE') as string,
        score: m?.score ?? null,
        evidenceCount: m?.evidenceCount ?? 0,
        state,
      };
    });

    const severity: Record<string, number> = { NEEDS_INTERVENTION: 0, WEAK: 1 };
    const focusBase = track
      .filter((t) => t.level === 'NEEDS_INTERVENTION' || t.level === 'WEAK')
      .sort(
        (a, b) =>
          (severity[a.level] ?? 9) - (severity[b.level] ?? 9) ||
          (a.score ?? 0) - (b.score ?? 0) ||
          a.index - b.index,
      );
    const focusIds = focusBase.map((f) => f.conceptId);

    const [plans, questionCounts, retestAssignments] = await Promise.all([
      focusIds.length
        ? this.prisma.remediationPlan.findMany({
            where: { studentId: student.id, conceptId: { in: focusIds } },
            include: { items: { orderBy: { order: 'asc' } } },
          })
        : Promise.resolve([]),
      focusIds.length
        ? this.prisma.question.groupBy({
            by: ['conceptId'],
            where: { conceptId: { in: focusIds }, status: 'APPROVED' },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      this.prisma.assessmentAssignment.findMany({
        where: { studentId: student.id, assessment: { title: 'Retest', status: 'PUBLISHED' } },
        include: {
          assessment: {
            select: { id: true, title: true, dueAt: true, chapter: { select: { name: true } } },
          },
        },
      }),
    ]);

    const planByConcept = new Map(plans.map((p) => [p.conceptId, p]));
    const questionCountByConcept = new Map(questionCounts.map((q) => [q.conceptId, q._count._all]));

    const focus = focusBase.map((f) => {
      const plan = planByConcept.get(f.conceptId);
      return {
        conceptId: f.conceptId,
        conceptName: f.conceptName,
        chapterId: f.chapterId,
        chapterName: f.chapterName,
        subjectId: f.subjectId,
        subjectName: f.subjectName,
        grade: f.grade,
        level: f.level,
        score: f.score,
        evidenceCount: f.evidenceCount,
        practiceQuestionCount: questionCountByConcept.get(f.conceptId) ?? 0,
        plan: plan
          ? {
              id: plan.id,
              status: plan.status,
              totalSteps: plan.items.length,
              completedSteps: plan.items.filter((i) => i.status === 'COMPLETED').length,
            }
          : null,
        steps: (plan?.items ?? []).map((i) => ({
          id: i.id,
          title: i.title,
          contentType: i.contentType,
          contentId: i.contentId,
          status: i.status,
          order: i.order,
        })),
      };
    });

    const retestAssessmentIds = retestAssignments.map((a) => a.assessmentId);
    const retestAttempts = retestAssessmentIds.length
      ? await this.prisma.assessmentAttempt.findMany({
          where: { studentId: student.id, assessmentId: { in: retestAssessmentIds } },
          select: { assessmentId: true, status: true },
        })
      : [];
    const attemptByAssessment = new Map<string, string>();
    for (const a of retestAttempts) attemptByAssessment.set(a.assessmentId, a.status);
    const pendingRetests = retestAssignments
      .filter((a) => !['SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED'].includes(attemptByAssessment.get(a.assessmentId) ?? ''))
      .map((a) => ({
        assessmentId: a.assessmentId,
        title: a.assessment.title,
        chapterName: a.assessment.chapter?.name ?? null,
        dueAt: a.assessment.dueAt,
        started: attemptByAssessment.get(a.assessmentId) === 'IN_PROGRESS',
      }));

    const stateCounts = { DONE: 0, IN_PROGRESS: 0, NOT_STARTED: 0 };
    const levelCounts: Record<string, number> = {};
    for (const t of track) {
      stateCounts[t.state] += 1;
      levelCounts[t.level] = (levelCounts[t.level] ?? 0) + 1;
    }

    let next: {
      conceptId: string;
      conceptName: string;
      chapterName: string;
      action: 'FIX' | 'STUDY' | 'RETEST';
      reason: string;
    } | null = null;
    if (focus.length > 0) {
      next = {
        conceptId: focus[0].conceptId,
        conceptName: focus[0].conceptName,
        chapterName: focus[0].chapterName,
        action: 'FIX',
        reason: `Weakest concept right now — ${focus[0].score ?? 0}% mastery`,
      };
    } else if (pendingRetests.length > 0) {
      next = {
        conceptId: '',
        conceptName: pendingRetests[0].title,
        chapterName: pendingRetests[0].chapterName ?? '',
        action: 'RETEST',
        reason: 'A retest is waiting for you',
      };
    } else {
      const pending = track.find((t) => t.state !== 'DONE');
      if (pending) {
        next = {
          conceptId: pending.conceptId,
          conceptName: pending.conceptName,
          chapterName: pending.chapterName,
          action: 'STUDY',
          reason: 'Next in your curriculum order',
        };
      }
    }

    return {
      student: {
        id: student.id,
        name: student.name,
        grade: student.grade,
        grades: access.grades,
        allGrades: access.unrestricted,
      },
      summary: {
        totalConcepts: track.length,
        done: stateCounts.DONE,
        inProgress: stateCounts.IN_PROGRESS,
        notStarted: stateCounts.NOT_STARTED,
        masteryPercent: track.length > 0 ? Math.round((stateCounts.DONE / track.length) * 100) : 0,
        weakConcepts: focus.length,
        untestedConcepts: stateCounts.NOT_STARTED,
        pendingRetests: pendingRetests.length,
        byLevel: levelCounts,
      },
      next,
      focus,
      retests: pendingRetests,
      track,
    };
  }

  /**
   * Ready-made exams: for every class+subject the student can open, a Term 1,
   * Term 2 and Class-test paper generated from the approved question bank.
   *
   * The blueprint is deterministic (the same key always means the same paper), so
   * the exam a student starts today is the exam their classmate sees tomorrow.
   */
  async listExams(user: RequestUser) {
    const access = await this.gradeAccess.forUser(user);
    const grades = access.unrestricted
      ? (await this.prisma.grade.findMany({ orderBy: { order: 'asc' }, select: { name: true } })).map((g) => g.name)
      : access.grades;
    if (grades.length === 0) return { exams: [] };

    const counts = await this.prisma.question.groupBy({
      by: ['subjectId', 'grade'],
      where: { status: 'APPROVED', grade: { in: grades } },
      _count: { _all: true },
    });
    if (counts.length === 0) return { exams: [] };

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: [...new Set(counts.map((c) => c.subjectId))] } },
      select: { id: true, name: true, code: true },
    });
    const subjectById = new Map(subjects.map((s) => [s.id, s]));

    const exams: Array<Record<string, unknown>> = [];
    for (const row of counts) {
      const subject = subjectById.get(row.subjectId);
      if (!subject) continue;
      for (const blueprint of EXAM_BLUEPRINTS) {
        const questionCount = Math.min(blueprint.questions, row._count._all);
        if (questionCount < 5) continue;
        exams.push({
          key: `${subject.code}-${row.grade}-${blueprint.key}`,
          title: `${subject.name} · ${blueprint.label} · Class ${row.grade}`,
          blueprint: blueprint.key,
          blueprintLabel: blueprint.label,
          grade: row.grade,
          subject: { id: subject.id, name: subject.name, code: subject.code },
          questionCount,
          totalMarks: questionCount,
          durationMinutes: blueprint.durationMinutes,
        });
      }
    }

    exams.sort((a, b) => {
      const ga = Number(a.grade);
      const gb = Number(b.grade);
      if (ga !== gb) return ga - gb;
      const sa = String((a.subject as { name: string }).name);
      const sb = String((b.subject as { name: string }).name);
      if (sa !== sb) return sa.localeCompare(sb);
      return String(a.blueprint).localeCompare(String(b.blueprint));
    });

    return { exams };
  }

  /**
   * Start a ready-made exam. The assessment is created once per institution and
   * reused afterwards, so the exam keeps one identity (and one set of questions)
   * across students and attempts.
   */
  async startExam(user: RequestUser, key: string) {
    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can start an exam');

    const match = /^([A-Z]+)-(\d+)-(.+)$/.exec(key);
    if (!match) throw new BadRequestException('Unknown exam');
    const [, subjectCode, grade, blueprintKey] = match;
    const blueprint = EXAM_BLUEPRINTS.find((b) => b.key === blueprintKey);
    if (!blueprint) throw new BadRequestException('Unknown exam');

    const access = await this.gradeAccess.forUser(user);
    this.gradeAccess.assert(access, grade);

    const subject = await this.prisma.subject.findFirst({
      where: { code: subjectCode },
      select: { id: true, name: true, code: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const title = `${subject.name} · ${blueprint.label} · Class ${grade}`;
    const institutionId = student.institutionId;
    if (!institutionId) throw new ForbiddenException('No institution on this account');

    const existing = await this.prisma.assessment.findFirst({
      where: { institutionId, title, subjectId: subject.id },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.assessmentAssignment.createMany({
        data: [{ assessmentId: existing.id, studentId: student.id }],
        skipDuplicates: true,
      });
      return { assessmentId: existing.id, title };
    }

    const offset = blueprint.key === 'term-2' ? 20 : blueprint.key === 'class-test' ? 40 : 0;
    const loadQuestions = (skip: number) =>
      this.prisma.question.findMany({
        where: { status: 'APPROVED', grade, subjectId: subject.id },
        orderBy: [{ createdAt: 'asc' }],
        skip,
        take: blueprint.questions,
        include: { options: { orderBy: { order: 'asc' } } },
      });

    // Each blueprint reads a different slice of the bank, so Term 1, Term 2 and the
    // class test are different papers. A thin bank falls back to the start.
    let questions = await loadQuestions(offset);
    if (questions.length < 5 && offset > 0) questions = await loadQuestions(0);
    if (questions.length < 5) throw new BadRequestException('Not enough questions for this exam yet');

    const assessment = await this.prisma.assessment.create({
      data: {
        institutionId,
        title,
        subjectId: subject.id,
        totalMarks: questions.reduce((sum, q) => sum + (q.marks ?? 1), 0),
        durationMinutes: blueprint.durationMinutes,
        status: 'PUBLISHED',
        attemptsAllowed: 1,
        createdById: user.sub,
        questions: {
          create: questions.map((q, index) => ({
            questionId: q.id,
            text: q.text,
            type: q.type,
            marks: q.marks ?? 1,
            answer: q.answer,
            explanation: q.explanation,
            conceptId: q.conceptId,
            order: index + 1,
            options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })),
          })),
        },
        assignments: { create: [{ studentId: student.id }] },
      },
      select: { id: true },
    });

    return { assessmentId: assessment.id, title };
  }

  async startPractice(user: RequestUser, conceptId: string, questionCount: number) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: { topic: { select: { chapter: { select: { grade: true } } } } },
    });
    if (!concept) throw new NotFoundException('Concept not found');

    // Concept practice was the one reading path without a class check: a student
    // could practise any concept of any class by id.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), concept.topic.chapter.grade);

    const take = clampQuestionCount(questionCount, DEFAULT_PRACTICE_QUESTIONS);
    const questionSelect = {
      id: true,
      text: true,
      type: true,
      marks: true,
      conceptId: true,
      options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
    } as const;

    // Fetch a wider pool than we hand out: a practice set that happens to be all
    // written answers cannot be auto-graded, so it would score 0/100 even when
    // every answer was right. Auto-gradable questions are preferred, and written
    // ones only fill the remaining slots.
    const poolSize = Math.min(take * 4, 40);
    let questions = await this.prisma.question.findMany({
      where: { conceptId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: poolSize,
      select: questionSelect,
    });

    // A concept that has no questions of its own still has to be practisable:
    // draw the pool from its chapter and credit each question to its own concept
    // (the submit path splits the evidence per concept when conceptIds has more
    // than one entry).
    let fromChapter = false;
    if (questions.length === 0) {
      const chapterId = (
        await this.prisma.concept.findUnique({
          where: { id: conceptId },
          select: { topic: { select: { chapterId: true } } },
        })
      )?.topic.chapterId;
      if (chapterId) {
        questions = await this.prisma.question.findMany({
          where: { chapterId, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: poolSize,
          select: questionSelect,
        });
        fromChapter = questions.length > 0;
      }
    }

    if (questions.length === 0) {
      throw new BadRequestException('No practice questions available for this concept');
    }

    const shuffle = <T,>(list: T[]): T[] => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };
    const autoGradable = shuffle(questions.filter((q) => this.mastery.isObjectiveType(q.type)));
    const written = shuffle(questions.filter((q) => !this.mastery.isObjectiveType(q.type)));
    const chosen = [...autoGradable, ...written].slice(0, take);

    const sessionConceptIds = [
      ...new Set(chosen.map((q) => q.conceptId).filter((id): id is string => Boolean(id))),
    ];
    const shuffled = shuffle(chosen);

    const practiceSet = await this.prisma.practiceSet.create({
      data: {
        studentId: student.id,
        conceptId,
        conceptIds: sessionConceptIds.length > 0 ? sessionConceptIds : [conceptId],
        questionIds: shuffled.map((q) => q.id),
        status: 'IN_PROGRESS',
        total: shuffled.length,
        startedAt: new Date(),
      },
    });

    return {
      practiceId: practiceSet.id,
      fromChapter,
      questions: shuffled.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks ?? 1,
        options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  }

  /**
   * A practice set that covers every concept of a chapter (the "practice the
   * whole chapter" button of the chapter hub).
   */
  async startChapterPractice(user: RequestUser, chapterId: string, questionCount: number) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { topics: { select: { concepts: { select: { id: true } } } } },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    // Any of the student's enrolled classes may be practised.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), chapter.grade);

    const conceptIds = chapter.topics.flatMap((t) => t.concepts.map((c) => c.id));
    if (conceptIds.length === 0) {
      throw new BadRequestException('This chapter has no concepts to practise yet');
    }

    const take = clampQuestionCount(questionCount, DEFAULT_CHAPTER_PRACTICE_QUESTIONS);
    // Same rule as the concept-level practice: a set made only of written answers
    // cannot be auto-graded and would score 0/100, so a wider pool is drawn and
    // auto-gradable questions fill the session first.
    const questions = await this.prisma.question.findMany({
      where: { conceptId: { in: conceptIds }, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(take * 4, 60),
      select: {
        id: true,
        conceptId: true,
        text: true,
        type: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException('No practice questions available for this chapter');
    }

    const shuffleList = <T>(list: T[]) => [...list].sort(() => Math.random() - 0.5);
    const gradable = shuffleList(questions.filter((q) => this.mastery.isObjectiveType(q.type)));
    const written = shuffleList(questions.filter((q) => !this.mastery.isObjectiveType(q.type)));
    const shuffled = shuffleList([...gradable, ...written].slice(0, take));

    const practiceSet = await this.prisma.practiceSet.create({
      data: {
        studentId: student.id,
        conceptId: null,
        conceptIds,
        questionIds: shuffled.map((q) => q.id),
        status: 'IN_PROGRESS',
        total: shuffled.length,
        startedAt: new Date(),
      },
    });

    return {
      practiceId: practiceSet.id,
      chapterId: chapter.id,
      questionCount: shuffled.length,
      questions: shuffled.map((q) => ({
        id: q.id,
        conceptId: q.conceptId,
        text: q.text,
        type: q.type,
        marks: q.marks ?? 1,
        options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  }

  /**
   * The NCERT PDF of a chapter, when the book is on disk. `null` means the
   * client must show its "not available" state.
   */
  async getChapterPdf(user: RequestUser, chapterId: string): Promise<{ path: string; fileName: string } | null> {
    const chapter = await this.chapterForUser(user, chapterId);

    const path = chapterPdfPath(chapter.code);
    if (!path) return null;
    return { path, fileName: chapterPdfFileName(chapter.name, chapter.code) };
  }

  /**
   * The rendered pages of a chapter's textbook, in reading order.
   *
   * Same authorisation as the PDF; an empty list means this deployment does not
   * ship the book on disk (the `books/` tree is git-ignored).
   */
  async getChapterPages(user: RequestUser, chapterId: string): Promise<{ code: string; files: string[] }> {
    const chapter = await this.chapterForUser(user, chapterId);
    return { code: chapter.code, files: chapterPageFiles(chapter.code) };
  }

  /**
   * The chapter row after the caller checks (browse context + grade).
   *
   * Extracted so the PDF, the signed link and the page images cannot drift apart
   * in what they let a student open.
   */
  private async chapterForUser(
    user: RequestUser,
    chapterId: string,
  ): Promise<{ id: string; name: string; code: string; grade: string }> {
    this.requireBrowseContext(user);

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, name: true, code: true, grade: true },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    this.gradeAccess.assert(await this.gradeAccess.forUser(user), chapter.grade);

    return chapter;
  }

  /**
   * Filesystem side of a chapter PDF, without the caller checks.
   *
   * Used by the signed-link route: the signature already proves that an
   * authenticated, grade-checked user asked for this exact chapter, so the
   * student lookup is not repeated.
   */
  async getChapterPdfFile(chapterId: string): Promise<{ path: string; fileName: string } | null> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { id: true, name: true, code: true },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const path = chapterPdfPath(chapter.code);
    if (!path) return null;
    return { path, fileName: chapterPdfFileName(chapter.name, chapter.code) };
  }

  /** One rendered page of a chapter textbook (1-based), or null when absent. */
  async getChapterPageFile(chapterId: string, page: number): Promise<string | null> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { code: true },
    });
    if (!chapter) return null;
    return chapterPageFiles(chapter.code)[page - 1] ?? null;
  }

  async getPractice(user: RequestUser, practiceId: string) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({ where: { id: practiceId } });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');

    const questionIds = practiceSet.questionIds as string[];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        text: true,
        type: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
      },
    });

    const ordered = questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean);

    return {
      practiceId: practiceSet.id,
      status: practiceSet.status,
      conceptId: practiceSet.conceptId,
      score: practiceSet.score,
      correctCount: practiceSet.correctCount,
      total: practiceSet.total,
      startedAt: practiceSet.startedAt,
      completedAt: practiceSet.completedAt,
      questions: ordered.map((q) => ({
        id: q!.id,
        text: q!.text,
        type: q!.type,
        marks: q!.marks ?? 1,
        options: q!.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  }

  async savePracticeAnswer(
    user: RequestUser,
    practiceId: string,
    questionId: string,
    answer: string,
  ) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({ where: { id: practiceId } });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');
    if (practiceSet.status !== 'IN_PROGRESS') throw new ConflictException('Practice set is already completed');

    const questionIds = practiceSet.questionIds as string[];
    if (!questionIds.includes(questionId)) {
      throw new BadRequestException('Question not in this practice set');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    let isCorrect: boolean | null = null;
    let correctAnswer: string | undefined;

    // The graded answer is the option text; a client that sends the option id is
    // resolved here so a correct answer can never be marked wrong.
    const gradedAnswer = normaliseAnswerToOptionText(question, answer);

    if (this.mastery.isObjectiveType(question.type)) {
      const graded = this.mastery.gradeAssessmentQuestion(
        { id: question.id, type: question.type, marks: question.marks ?? 1, answer: question.answer, options: question.options },
        gradedAnswer,
      );
      isCorrect = graded?.correct ?? false;
      correctAnswer = question.answer;
    }

    await this.prisma.practiceAnswer.upsert({
      where: { practiceSetId_questionId: { practiceSetId: practiceId, questionId } },
      create: { practiceSetId: practiceId, questionId, answer: gradedAnswer, isCorrect },
      update: { answer: gradedAnswer, isCorrect },
    });

    return { correct: isCorrect, correctAnswer };
  }

  async submitPractice(user: RequestUser, practiceId: string) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({
      where: { id: practiceId },
      include: { answers: true },
    });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');
    if (practiceSet.status !== 'IN_PROGRESS') throw new ConflictException('Practice set is already completed');

    const questionIds = (practiceSet.questionIds as string[]) ?? [];
    const totalQuestions = questionIds.length;

    // Which questions can be graded at all?  A written answer is never
    // auto-graded, so it is neither right nor wrong: it is not in the score and
    // not in the mastery evidence (the assessment path works the same way).
    const questionRows = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, conceptId: true, type: true },
    });
    const gradableIds = new Set(
      questionRows.filter((q) => this.mastery.isObjectiveType(q.type)).map((q) => q.id),
    );

    // An answer counts as given when it is not empty.
    const answeredIds = new Set(
      practiceSet.answers
        .filter((a) => typeof a.answer === 'string' && a.answer.trim().length > 0)
        .map((a) => a.questionId),
    );
    const gradedIds = new Set([...answeredIds].filter((id) => gradableIds.has(id)));
    const correctIds = new Set(
      practiceSet.answers.filter((a) => a.isCorrect === true).map((a) => a.questionId),
    );

    const gradedQuestions = gradedIds.size;
    const answeredQuestions = answeredIds.size;
    const pendingGrading = [...answeredIds].filter((id) => !gradableIds.has(id)).length;
    const correctAnswers = [...gradedIds].filter((id) => correctIds.has(id)).length;
    const score = gradedQuestions > 0 ? Math.round((correctAnswers / gradedQuestions) * 100) : 0;

    await this.prisma.practiceSet.update({
      where: { id: practiceId },
      data: {
        status: 'COMPLETED',
        score,
        correctCount: correctAnswers,
        completedAt: new Date(),
      },
    });

    let masteryUpdate = null;
    let masteryUpdates: Array<{ conceptId: string; level: string; score: number }> = [];
    const sessionConceptIds = Array.isArray(practiceSet.conceptIds)
      ? (practiceSet.conceptIds as string[])
      : [];
    if (practiceSet.conceptId && sessionConceptIds.length <= 1) {
      const conceptId = practiceSet.conceptId;
      const conceptEvidence = [{
        conceptId,
        questions: gradedQuestions,
        correct: correctAnswers,
      }];

      const results = await this.mastery.applyAttemptEvidence(student.id, { practiceSetId: practiceId }, conceptEvidence);
      if (results.length > 0) {
        masteryUpdate = { level: results[0].level, score: results[0].combinedScore };
        masteryUpdates = results.map((r) => ({ conceptId: r.conceptId, level: r.level, score: r.combinedScore }));
      }
    } else {
      // A chapter practice (or a concept whose questions come from the chapter)
      // spans several concepts, so the evidence is split per concept - otherwise
      // one run would be credited to no concept.
      const conceptIds = sessionConceptIds;
      if (conceptIds.length > 0) {
        const perConcept = new Map<string, { questions: number; correct: number }>();
        for (const conceptId of conceptIds) {
          perConcept.set(conceptId, { questions: 0, correct: 0 });
        }
        for (const question of questionRows) {
          if (!question.conceptId) continue;
          const bucket = perConcept.get(question.conceptId);
          if (!bucket) continue;
          // Only the graded, answered questions are evidence.
          if (!gradedIds.has(question.id)) continue;
          bucket.questions += 1;
          if (correctIds.has(question.id)) bucket.correct += 1;
        }
        const conceptEvidence = [...perConcept.entries()]
          .filter(([, value]) => value.questions > 0)
          .map(([conceptId, value]) => ({ conceptId, questions: value.questions, correct: value.correct }));

        const results = await this.mastery.applyAttemptEvidence(
          student.id,
          { practiceSetId: practiceId },
          conceptEvidence,
        );
        masteryUpdates = results.map((r) => ({ conceptId: r.conceptId, level: r.level, score: r.combinedScore }));
        const weakest = [...masteryUpdates].sort((a, b) => a.score - b.score)[0];
        if (weakest) masteryUpdate = { level: weakest.level, score: weakest.score };
      }
    }

    // Practice is the main learning activity, so it earns XP like an assessment
    // does. The XP ledger stays the single source of truth for the leaderboard.
    // The completion bonus is only paid when the student actually answered
    // something - otherwise a set could be started and submitted over and over
    // to farm the bonus (and the streak) without doing any work.
    const xpEarned =
      correctAnswers * XP_PER_PRACTICE_CORRECT + (answeredQuestions > 0 ? XP_PRACTICE_COMPLETION : 0);
    await awardStudentXp(this.prisma, student.id, xpEarned, 'PRACTICE_COMPLETED');

    return {
      score,
      totalQuestions,
      correctAnswers,
      masteryUpdate,
      masteryUpdates,
      xpEarned,
      // How the score was reached: only graded, answered questions count.
      gradedQuestions,
      answeredQuestions,
      // Written answers that are waiting for a teacher to look at them.
      pendingGrading,
    };
  }

  async getGamificationProfile(user: RequestUser) {
    const student = await this.identity.resolveForUser(user);
    if (!student) {
      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        throw new ForbiddenException('Only students have gamification profiles');
      }
      return {};
    }
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const institutionFilter = institutionId ? { institutionId } : {};

    const profile = await this.prisma.gamificationProfile.findUnique({
      where: { studentId: student.id },
    });

    const xp = profile?.xp ?? 0;
    const level = Math.floor(xp / 500) + 1;
    const xpInLevel = xp % 500;
    const xpForLevel = 500;

    // Compute rank within institution
    const members = await this.prisma.institutionMember.findMany({
      where: { ...institutionFilter, role: 'STUDENT', status: 'ACTIVE' },
      select: { userId: true },
    });
    const allStudentUserIds = members.map((m) => m.userId);
    const allStudents = await this.prisma.student.findMany({
      where: { userId: { in: allStudentUserIds }, ...institutionFilter },
      select: { id: true },
    });
    const allStudentIds = allStudents.map((s) => s.id);
    const allProfiles = await this.prisma.gamificationProfile.findMany({
      where: { studentId: { in: allStudentIds } },
      select: { studentId: true, xp: true },
    });
    const sorted = allProfiles.sort((a, b) => b.xp - a.xp);
    const rank = sorted.findIndex((p) => p.studentId === student.id) + 1 || 1;

    const achievementCount = await this.prisma.studentAchievement.count({
      where: { studentId: student.id },
    });

    const recentAchievements = await this.prisma.studentAchievement.findMany({
      where: { studentId: student.id },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
      include: { achievement: true },
    });

    return {
      xp,
      level,
      xpInLevel,
      xpForLevel,
      rank,
      streakDays: profile?.streakDays ?? 0,
      achievementCount,
      recentAchievements: recentAchievements.map((a) => ({
        id: a.achievement.id,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt,
      })),
    };
  }

  /** Groups the caller may rank within: their class (student), their classes (teacher),
   *  every class (admin). Leaderboards that compare you with peers you recognise are the
   *  ones that stay motivating; a single global board for everyone is much weaker. */
  private async leaderboardScopes(user: RequestUser, institutionFilter: Record<string, unknown>) {
    if (user.role === 'STUDENT') {
      const memberships = await this.prisma.groupMembership.findMany({
        where: { student: { userId: user.sub }, leftAt: null },
        select: { groupId: true },
      });
      const ids = [...new Set(memberships.map((m) => m.groupId))];
      if (!ids.length) return [];
      return this.prisma.group.findMany({
        where: { id: { in: ids }, ...institutionFilter },
        select: { id: true, name: true, grade: true },
        orderBy: { name: 'asc' },
      });
    }
    if (user.role === 'TEACHER') {
      const teacherGroups = await this.prisma.teacherGroup.findMany({
        where: { teacher: { userId: user.sub } },
        select: { groupId: true },
      });
      const ids = [...new Set(teacherGroups.map((t) => t.groupId))];
      if (!ids.length) return [];
      return this.prisma.group.findMany({
        where: { id: { in: ids }, ...institutionFilter },
        select: { id: true, name: true, grade: true },
        orderBy: { name: 'asc' },
      });
    }
    return this.prisma.group.findMany({
      where: { ...institutionFilter, status: 'ACTIVE' },
      select: { id: true, name: true, grade: true },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });
  }

  async getLeaderboard(user: RequestUser, period: string, groupId?: string) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const institutionFilter = institutionId ? { institutionId } : {};

    const scopes = await this.leaderboardScopes(user, institutionFilter);

    let scopedStudentIds: string[] | null = null;
    if (groupId) {
      if (!scopes.some((g) => g.id === groupId)) {
        throw new ForbiddenException('You cannot view that class leaderboard');
      }
      const memberships = await this.prisma.groupMembership.findMany({
        where: { groupId, leftAt: null },
        select: { studentId: true },
      });
      scopedStudentIds = memberships.map((m) => m.studentId);
    }

    const members = await this.prisma.institutionMember.findMany({
      where: { ...institutionFilter, role: 'STUDENT', status: 'ACTIVE' },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);

    const students = await this.prisma.student.findMany({
      where: {
        userId: { in: userIds },
        ...institutionFilter,
        ...(scopedStudentIds ? { id: { in: scopedStudentIds } } : {}),
      },
      select: { id: true, userId: true, name: true },
    });

    const studentIds = students.map((s) => s.id);
    const profiles = await this.prisma.gamificationProfile.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, xp: true, streakDays: true },
    });

    const profileMap = new Map(profiles.map((p) => [p.studentId, p]));

    // A window is read from the XP ledger, the lifetime from the profile
    // counter: the counter is the lifetime, the ledger is what happened inside
    // the window.
    const periodKey = period.toLowerCase();
    const windowDays = periodKey in LEADERBOARD_PERIOD_DAYS ? LEADERBOARD_PERIOD_DAYS[periodKey] : 7;
    // "This week" must mean the calendar week, not a rolling 7x24h window - otherwise
    // Monday's XP counts into last week and the label lies.
    const from = windowDays
      ? periodKey === 'weekly'
        ? startOfCurrentWeek()
        : new Date(Date.now() - windowDays * 86400000)
      : null;

    // The window is filtered in the database: the ledger grows by one row per
    // activity per student, so loading every row on every request does not
    // scale.
    const windowXp = new Map<string, number>();
    if (from) {
      const rows = await this.prisma.xpEvent.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, createdAt: { gte: from } },
        _sum: { xp: true },
      });
      for (const row of rows) windowXp.set(row.studentId, row._sum.xp ?? 0);
    }

    const entries = students
      .map((s) => {
        const p = profileMap.get(s.id);
        // The lifetime counter is the lifetime.
        const lifetime = p?.xp ?? 0;
        // A window is what the ledger says. A profile that predates the ledger
        // has no events in the window, so it contributes 0 there - never its
        // lifetime XP, which would be a lie ("This Week" is not "All time").
        const xp = from ? (windowXp.get(s.id) ?? 0) : lifetime;
        return {
          userId: s.userId,
          name: s.name,
          xp,
          totalXp: lifetime,
          level: Math.floor(lifetime / 500) + 1,
          streakDays: p?.streakDays ?? 0,
        };
      })
      .sort((a, b) => b.xp - a.xp || b.totalXp - a.totalXp)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    const myEntry = entries.find((e) => e.userId === user.sub);
    const myRank = myEntry?.rank ?? 0;

    return {
      entries,
      myRank,
      period,
      groupId: groupId ?? null,
      groups: scopes.map((g) => ({ id: g.id, name: g.name, grade: g.grade })),
    };
  }

  async getAchievements(user: RequestUser) {
    const allAchievements = await this.prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });

    const student = await this.identity.resolveForUser(user);
    if (!student) {
      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        throw new ForbiddenException('Only students have achievements');
      }
      return {
        earned: [],
        locked: allAchievements.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          key: a.key,
        })),
      };
    }

    const earned = await this.prisma.studentAchievement.findMany({
      where: { studentId: student.id },
      include: { achievement: true },
    });

    const earnedIds = new Set(earned.map((e) => e.achievementId));

    return {
      earned: earned.map((e) => ({
        id: e.achievement.id,
        name: e.achievement.name,
        description: e.achievement.description,
        icon: e.achievement.icon,
        key: e.achievement.key,
        unlockedAt: e.unlockedAt,
      })),
      locked: allAchievements
        .filter((a) => !earnedIds.has(a.id))
        .map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          key: a.key,
        })),
    };
  }
}
