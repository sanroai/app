import { describe, it, expect } from 'vitest';
import { LearningService } from './learning.service';
import { RequestUser } from '../common/types/auth-context';
import { Role } from '@sanro/types';

const CONCEPT_A = 'concept-a';
const CONCEPT_B = 'concept-b';
const CONCEPT_EMPTY = 'concept-empty';

const q = (id: string, conceptId: string) => ({ id, conceptId, status: 'APPROVED' });

const QUESTIONS = [
  q('q-a1', CONCEPT_A),
  q('q-a2', CONCEPT_A),
  q('q-a3', CONCEPT_A),
  q('q-b1', CONCEPT_B),
  q('q-b2', CONCEPT_B),
];

const OPTIONS = [
  { id: 'opt-1', text: 'A', order: 0 },
  { id: 'opt-2', text: 'B', order: 1 },
];

function buildService() {
  const db = {
    concepts: new Map([
      [CONCEPT_A, { id: CONCEPT_A, name: 'Concept A', description: null, order: 1, topicId: 't-1', topic: { id: 't-1', name: 'Topic', chapterId: 'c-1', chapter: { id: 'c-1', name: 'Chapter', grade: '10' } } }],
      [CONCEPT_B, { id: CONCEPT_B, name: 'Concept B', description: null, order: 1, topicId: 't-1', topic: { id: 't-1', name: 'Topic', chapterId: 'c-1', chapter: { id: 'c-1', name: 'Chapter', grade: '10' } } }],
      // No questions of its own and no sibling questions either, so a practice
      // set over it is genuinely impossible.
      [CONCEPT_EMPTY, { id: CONCEPT_EMPTY, name: 'Concept Empty', description: null, order: 1, topicId: 't-2', topic: { id: 't-2', name: 'Topic', chapterId: 'c-empty', chapter: { id: 'c-empty', name: 'Empty', grade: '10' } } }],
    ]),
    questions: QUESTIONS,
    /** Question ids the student answered correctly inside the refresh window. */
    recentCorrect: new Set<string>(),
    students: [{ id: 's-1', userId: 'u-1' }],
    created: [] as any[],
  };

  const prisma: any = {
    concept: {
      findUnique: async ({ where }: any) => db.concepts.get(where.id) ?? null,
      findMany: async () => [],
    },
    question: {
      findMany: async ({ where, take }: any) => {
        let rows = db.questions.filter((row) => row.status === (where?.status ?? row.status));
        if (typeof where?.conceptId === 'string') {
          rows = rows.filter((row) => row.conceptId === where.conceptId);
        } else if (where?.conceptId?.not) {
          rows = rows.filter((row) => row.conceptId !== where.conceptId.not);
        }
        if (where?.chapterId) {
          // a question belongs to its concept's chapter; the fixtures only carry
          // the concept, so the chapter is resolved through the concept map
          rows = rows.filter((row) => db.concepts.get(row.conceptId)?.topic.chapterId === where.chapterId);
        }
        if (take && take !== Infinity) {
          rows = rows.slice(0, take);
        }
        return rows.map((row) => ({
          id: row.id,
          conceptId: row.conceptId,
          chapterId: db.concepts.get(row.conceptId)?.topic.chapterId ?? 'c-1',
          text: `Question ${row.id}`,
          type: 'MCQ',
          marks: 1,
          difficulty: 'EASY',
          answer: 'A',
          explanation: 'Because A is correct',
          options: OPTIONS,
        }));
      },
      findUnique: async ({ where }: any) => db.questions.find((row) => row.id === where.id) ?? null,
    },
    student: {
      findUnique: async () => db.students[0] ?? null,
    },
    contentItem: {
      findMany: async () => [],
    },
    contentProgress: {
      findMany: async () => [],
    },
    conceptMastery: {
      findUnique: async () => null,
    },
    practiceSet: {
      create: async (args: any) => {
        db.created.push(args.data);
        return { id: 'practice-1', ...args.data };
      },
    },
    practiceAnswer: {
      upsert: async () => ({}),
      findMany: async () => [...db.recentCorrect].map((questionId) => ({ questionId })),
    },
  };

  const tenant: any = { requireInstitution: () => 'inst-1' };
  const mastery: any = { isObjectiveType: () => true, gradeAssessmentQuestion: () => ({ correct: true }) };
  const identity: any = {
    resolveForUser: async () => db.students[0] ?? null,
    requireForUser: async () => db.students[0] ?? null,
  };
  const gradeAccess: any = {
    forUser: async () => ({ unrestricted: true, grades: [] }),
    forStudentId: async () => ({ unrestricted: true, grades: [] }),
    allows: () => true,
    assert: () => undefined,
    setEnrolments: async () => undefined,
    addEnrolment: async () => undefined,
  };
  const service = new LearningService(
    prisma,
    tenant,
    mastery,
    identity,
    gradeAccess,
    { buildContentWhere: () => ({}) },
    // no cache in unit tests: every call builds, which is what the assertions see
    {
      wrap: async <T,>(_key: string, build: () => Promise<T>) => build(),
      invalidateAccount: () => undefined,
    } as unknown as import('../common/cache/response-cache.service').ResponseCacheService,
  );
  return { service, db };
}

const studentUser: RequestUser = {
  sub: 'u-1',
  role: Role.STUDENT,
  institutionId: 'inst-1',
  jti: 'jti-1',
};

describe('LearningService question–concept isolation', () => {
  it('getConceptDetail returns only questions belonging to the requested concept', async () => {
    const { service } = buildService();
    const detail = await service.getConceptDetail(studentUser, CONCEPT_B);
    const ids = detail.practiceQuestions.map((p: any) => p.id);
    expect(ids).toEqual(['q-b1', 'q-b2']);
    expect(ids.some((id: string) => id.startsWith('q-a'))).toBe(false);
  });

  it('startPractice only assembles practice questions from the requested concept', async () => {
    const { service, db } = buildService();
    const started = await service.startPractice(studentUser, CONCEPT_A, 2);
    const ids = started.questions.map((s: any) => s.id);
    // A wider pool is shuffled into the session, so the exact pair varies — what
    // must never vary is that every question belongs to the requested concept.
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id: string) => id.startsWith('q-a'))).toBe(true);
    const created = db.created[0];
    expect(created.conceptId).toBe(CONCEPT_A);
    const createdIds = [...(created.questionIds as string[])];
    expect(createdIds).toHaveLength(2);
    expect(createdIds.every((id: string) => id.startsWith('q-a'))).toBe(true);
  });

  it('startPractice rejects when the concept has no approved questions', async () => {
    const { service } = buildService();
    await expect(service.startPractice(studentUser, CONCEPT_EMPTY, 5)).rejects.toThrow(
      'No practice questions available for this concept',
    );
  });

  it('startPractice does not re-serve a question answered correctly in the last few days', async () => {
    const { service, db } = buildService();
    db.recentCorrect.add('q-a1');

    const started = await service.startPractice(studentUser, CONCEPT_A, 5);
    const ids = started.questions.map((s: any) => s.id);

    // The 3-question concept loses the one just answered, so one question of the
    // sibling concept replaces it - that is the interleaving case, flagged to the
    // client as `fromChapter`.
    expect(ids).not.toContain('q-a1');
    expect(started.fromChapter).toBe(true);
    expect(ids).toHaveLength(3);
  });

  it('startPractice uses sibling questions when every question of the concept was answered recently', async () => {
    const { service, db } = buildService();
    for (const id of ['q-a1', 'q-a2', 'q-a3']) db.recentCorrect.add(id);

    const started = await service.startPractice(studentUser, CONCEPT_A, 2);
    const ids = started.questions.map((s: any) => s.id);

    // Nothing fresh is left in the concept, so the set is mostly drawn from its
    // chapter - but one question of the concept comes back, because a concept
    // practice has to credit the concept the student chose.
    expect(started.fromChapter).toBe(true);
    expect(ids).toHaveLength(2);
    expect(ids.filter((id: string) => id.startsWith('q-a'))).toHaveLength(1);
    expect(ids.filter((id: string) => id.startsWith('q-b'))).toHaveLength(1);
  });

  it('startPractice re-serves the concept questions when the chapter has nothing fresh either', async () => {
    const { service, db } = buildService();
    for (const id of ['q-a1', 'q-a2', 'q-a3', 'q-b1', 'q-b2']) db.recentCorrect.add(id);

    const started = await service.startPractice(studentUser, CONCEPT_A, 2);
    const ids = started.questions.map((s: any) => s.id);

    // An exhausted bank must still practise: a set that excluded everything would
    // be an error the student cannot act on.
    expect(started.fromChapter).toBe(false);
    expect(ids).toHaveLength(2);
    expect(ids.every((id: string) => id.startsWith('q-a'))).toBe(true);
  });

  it('getConceptDetail exposes answer and explanation for the practice payload', async () => {
    const { service } = buildService();
    const detail = await service.getConceptDetail(studentUser, CONCEPT_A);
    expect(detail.practiceQuestions[0]).toMatchObject({
      answer: 'A',
      explanation: 'Because A is correct',
    });
    expect('flashcardRatings' in detail).toBe(false);
  });
});