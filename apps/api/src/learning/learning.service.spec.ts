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
      [CONCEPT_A, { id: CONCEPT_A, name: 'Concept A', description: null, order: 1, topicId: 't-1', topic: { id: 't-1', name: 'Topic', chapter: { id: 'c-1', name: 'Chapter', grade: '10' } } }],
      [CONCEPT_B, { id: CONCEPT_B, name: 'Concept B', description: null, order: 1, topicId: 't-1', topic: { id: 't-1', name: 'Topic', chapter: { id: 'c-1', name: 'Chapter', grade: '10' } } }],
      [CONCEPT_EMPTY, { id: CONCEPT_EMPTY, name: 'Concept Empty', description: null, order: 1, topicId: 't-1', topic: { id: 't-1', name: 'Topic', chapter: { id: 'c-1', name: 'Chapter', grade: '10' } } }],
    ]),
    questions: QUESTIONS,
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
        if (where?.conceptId) {
          rows = rows.filter((row) => row.conceptId === where.conceptId);
        }
        if (take && take !== Infinity) {
          rows = rows.slice(0, take);
        }
        return rows.map((row) => ({
          id: row.id,
          text: `Question ${row.id}`,
          type: 'MCQ',
          marks: 1,
          difficulty: 'EASY',
          options: OPTIONS,
        }));
      },
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
    practiceAnswer: { upsert: async () => ({}) },
  };

  const tenant: any = { requireInstitution: () => 'inst-1' };
  const mastery: any = { isObjectiveType: () => true, gradeAssessmentQuestion: () => ({ correct: true }) };
  const service = new LearningService(prisma, tenant, mastery);
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
    expect(started.questions.map((s: any) => s.id).sort()).toEqual(['q-a1', 'q-a2']);
    const created = db.created[0];
    expect(created.conceptId).toBe(CONCEPT_A);
    expect([...(created.questionIds as string[])].sort()).toEqual(['q-a1', 'q-a2']);
  });

  it('startPractice rejects when the concept has no approved questions', async () => {
    const { service } = buildService();
    await expect(service.startPractice(studentUser, CONCEPT_EMPTY, 5)).rejects.toThrow(
      'No practice questions available for this concept',
    );
  });
});