import { $Enums, PrismaClient } from '@prisma/client';

export interface SnapshotQuestionSource {
  id?: string;
  text: string;
  type: string;
  marks: number;
  answer: string | null;
  explanation?: string | null;
  conceptId?: string | null;
  options?: unknown;
}

/**
 * Derives a canonical, gradeable answer string from a source question.
 * - Objective MCQ / MULTI_SELECT: correct option text(s) joined by "||"
 * - TRUE_FALSE / FILL_BLANK: the stored answer
 * - Subjective: the stored answer (for the teacher answer key, not auto-graded)
 */
export function canonicalAnswer(type: string, answer: string | null, options?: unknown): string {
  if (type === 'MCQ' || type === 'MULTI_SELECT') {
    const opts = Array.isArray(options) ? options : [];
    const correct = opts.filter((o: { isCorrect?: boolean }) => o.isCorrect).map((o: { text: string }) => o.text);
    if (correct.length > 0) return correct.join('||');
  }
  return answer ?? '';
}

export async function snapshotQuestions(
  prisma: PrismaClient,
  assessmentId: string,
  questions: SnapshotQuestionSource[],
): Promise<void> {
  await prisma.assessmentQuestion.createMany({
    data: questions.map((q, i) => ({
      assessmentId,
      questionId: q.id ? (q.id as string) : null,
      text: q.text,
      type: q.type as $Enums.QuestionType,
      marks: q.marks,
      answer: canonicalAnswer(q.type, q.answer, q.options),
      explanation: q.explanation ?? null,
      conceptId: q.conceptId ?? null,
      options: Array.isArray(q.options) ? (q.options as object) : [],
      order: i + 1,
    })),
  });
}