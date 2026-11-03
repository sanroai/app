import { ForbiddenException, Injectable } from '@nestjs/common';
import { MasteryLevel } from '@sanro/types';
import { PrismaService } from '../prisma/prisma.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StudentGradeAccessService } from '../common/services/student-grade-access.service';
import { RequestUser } from '../common/types/auth-context';
import { LearningService, clampQuestionCount } from './learning.service';

/**
 * Spaced review: the concepts whose `nextReviewAt` has arrived.
 *
 * Distributed practice is a moderate, reliable effect (d = 0.54 in the 2025
 * classroom meta-analysis) and the platform had no mechanism for it at all -
 * a concept was practised once and never came back unless a retest happened to
 * be triggered. `ConceptMastery.nextReviewAt` is written by the mastery service
 * after every piece of evidence, so this queue is simply "what is due".
 *
 * The queue deliberately mixes subjects and chapters instead of grouping by one:
 * interleaving is worth a further ~0.34 in mathematics, and a review card that
 * returns to the same chapter every day is a blocked-practice schedule.
 */

/** The most concepts one review session asks for. */
const REVIEW_CONCEPT_LIMIT = 6;

/** The default size of a review practice set, in questions. */
const DEFAULT_REVIEW_QUESTIONS = 8;

/** Level ordering: the weakest concepts are reviewed first among equally due ones. */
const LEVEL_PRIORITY: Record<string, number> = {
  [MasteryLevel.NEEDS_INTERVENTION]: 0,
  [MasteryLevel.WEAK]: 1,
  [MasteryLevel.DEVELOPING]: 2,
  [MasteryLevel.INSUFFICIENT_EVIDENCE]: 3,
  [MasteryLevel.GOOD]: 4,
  [MasteryLevel.MASTERED]: 5,
};

export interface ReviewConcept {
  conceptId: string;
  name: string;
  chapterId: string;
  chapterName: string;
  grade: string;
  subject: string;
  level: string;
  score: number;
  intervalDays: number;
  dueAt: string | null;
  /** Why it is in the queue: the date arrived, or it has never been scheduled. */
  reason: 'due' | 'unscheduled';
}

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: StudentIdentityService,
    private readonly gradeAccess: StudentGradeAccessService,
    private readonly learning: LearningService,
  ) {}

  /**
   * The concepts due today, weakest first and mixed across subjects.
   *
   * `dueNow` is the true size of the backlog; `concepts` is the short session we
   * actually offer, so the card can say "6 of 23 due" without hiding the rest.
   */
  async getReviewQueue(user: RequestUser) {
    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can review');

    const access = await this.gradeAccess.forUser(user);
    const now = new Date();

    const rows = await this.prisma.conceptMastery.findMany({
      where: {
        studentId: student.id,
        OR: [{ nextReviewAt: null }, { nextReviewAt: { lte: now } }],
      },
      include: {
        concept: {
          select: {
            id: true,
            name: true,
            topic: {
              select: {
                chapter: {
                  select: {
                    id: true,
                    name: true,
                    grade: true,
                    subject: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ nextReviewAt: 'asc' }, { lastUpdatedAt: 'asc' }],
      take: 300,
    });

    // A concept from a class this account may not read is not offered - the same
    // rule every other learning read applies.
    const visible = rows.filter((row) => {
      const grade = row.concept.topic.chapter.grade;
      return access.unrestricted || access.grades.includes(grade);
    });

    visible.sort((a, b) => {
      const priority = (LEVEL_PRIORITY[a.level] ?? 9) - (LEVEL_PRIORITY[b.level] ?? 9);
      if (priority !== 0) return priority;
      const aDue = a.nextReviewAt?.getTime() ?? 0;
      const bDue = b.nextReviewAt?.getTime() ?? 0;
      return aDue - bDue;
    });

    // Round-robin by subject so a session never becomes one chapter repeated.
    const bySubject = new Map<string, typeof visible>();
    for (const row of visible) {
      const subject = row.concept.topic.chapter.subject.name;
      const list = bySubject.get(subject) ?? [];
      list.push(row);
      bySubject.set(subject, list);
    }
    const mixed: typeof visible = [];
    let added = true;
    while (added && mixed.length < REVIEW_CONCEPT_LIMIT) {
      added = false;
      for (const list of bySubject.values()) {
        const next = list.shift();
        if (next) {
          mixed.push(next);
          added = true;
        }
        if (mixed.length >= REVIEW_CONCEPT_LIMIT) break;
      }
    }

    const nextDue = await this.prisma.conceptMastery.findFirst({
      where: { studentId: student.id, nextReviewAt: { gt: now } },
      orderBy: { nextReviewAt: 'asc' },
      select: { nextReviewAt: true },
    });

    const concepts: ReviewConcept[] = mixed.map((row) => ({
      conceptId: row.conceptId,
      name: row.concept.name,
      chapterId: row.concept.topic.chapter.id,
      chapterName: row.concept.topic.chapter.name,
      grade: row.concept.topic.chapter.grade,
      subject: row.concept.topic.chapter.subject.name,
      level: row.level,
      score: row.score,
      intervalDays: row.reviewIntervalDays,
      dueAt: row.nextReviewAt ? row.nextReviewAt.toISOString() : null,
      reason: row.nextReviewAt ? 'due' : 'unscheduled',
    }));

    return {
      dueNow: visible.length,
      count: concepts.length,
      concepts,
      nextDueAt: nextDue?.nextReviewAt ? nextDue.nextReviewAt.toISOString() : null,
    };
  }

  /**
   * Start one practice set over the concepts due today.
   *
   * It reuses the group-practice path so the review set follows the same
   * selection rules as every other practice: shuffled, no question the student
   * just answered correctly, auto-gradable questions first.
   */
  async startReviewPractice(user: RequestUser, questionCount?: number) {
    const queue = await this.getReviewQueue(user);
    if (queue.count === 0) {
      return { practiceId: null, concepts: [], questions: [], questionCount: 0 };
    }

    const conceptIds = queue.concepts.map((concept) => concept.conceptId);
    const take = clampQuestionCount(questionCount ?? DEFAULT_REVIEW_QUESTIONS, DEFAULT_REVIEW_QUESTIONS);
    const practice = await this.learning.startConceptGroupPractice(user, conceptIds, take, null);

    return { ...practice, concepts: queue.concepts };
  }
}
