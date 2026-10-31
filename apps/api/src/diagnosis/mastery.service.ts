import { Injectable } from '@nestjs/common';
import { MasteryLevel, MasteryThresholds, getQuestionCategory } from '@sanro/types';
import { MASTERY_EVIDENCE_MIN_QUESTIONS } from '@sanro/config';
import { PrismaService } from '../prisma/prisma.service';

export interface GradableQuestion {
  id: string;
  type: string;
  marks: number;
  answer: string | null; // canonical answer computed at snapshot time
  options: unknown; // json array [{text, isCorrect, order}]
}

export interface StudentResponse {
  assessmentQuestionId: string;
  answer: string | null;
}

const norm = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase();

export function gradeObjectiveResponse(q: GradableQuestion, rawAnswer: string | null): { correct: boolean; skipped: boolean } | null {
  if (q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'FILL_BLANK') {
    if (!norm(rawAnswer)) return { correct: false, skipped: true };
    if (q.type === 'TRUE_FALSE') {
      return { correct: norm(q.answer) === norm(rawAnswer), skipped: false };
    }
    return { correct: norm(q.answer) === norm(rawAnswer), skipped: false };
  }
  if (q.type === 'MULTI_SELECT') {
    let selected: string[] = [];
    try {
      const parsed = JSON.parse(rawAnswer ?? '[]');
      selected = Array.isArray(parsed) ? parsed.map((s: unknown) => String(s).trim().toLowerCase()) : [];
    } catch {
      selected = [];
    }
    if (selected.length === 0) return { correct: false, skipped: true };
    const correctSet = new Set(
      (Array.isArray(q.options) ? q.options : [])
        .filter((o: { isCorrect?: boolean }) => o.isCorrect)
        .map((o: { text: string }) => o.text.trim().toLowerCase()),
    );
    const correct = selected.length === correctSet.size && selected.every((s) => correctSet.has(s));
    return { correct, skipped: false };
  }
  return null; // subjective / numerical — needs manual grading
}

/**
 * The graded answer is the option TEXT (that is what `question.answer` holds).
 * Some clients send the option id instead, which would silently mark every
 * answer wrong, so the id is resolved to its text before grading.
 */
export function normaliseAnswerToOptionText(
  question: { options?: Array<{ id: string; text: string }> },
  rawAnswer: string | null | undefined,
): string | null {
  if (rawAnswer == null) return rawAnswer ?? null;
  const options = question.options ?? [];
  if (options.length === 0) return rawAnswer;

  // MULTI_SELECT sends a JSON array of the selected options
  const trimmed = rawAnswer.trim();
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.map((entry) => {
            const value = String(entry);
            return options.find((o) => o.id === value)?.text ?? options.find((o) => o.text === value)?.text ?? value;
          }),
        );
      }
    } catch {
      // not JSON - fall through to the single-value handling
    }
  }

  if (options.some((o) => o.text === rawAnswer)) return rawAnswer;
  const byId = options.find((o) => o.id === rawAnswer);
  return byId ? byId.text : rawAnswer;
}

export function masteryLevelForScore(score: number, evidenceQuestionCount: number): MasteryLevel {
  if (!evidenceQuestionCount || evidenceQuestionCount < MASTERY_EVIDENCE_MIN_QUESTIONS) {
    return MasteryLevel.INSUFFICIENT_EVIDENCE;
  }
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= MasteryThresholds.MASTERED_MIN) return MasteryLevel.MASTERED;
  if (s > MasteryThresholds.GOOD_MAX) return MasteryLevel.GOOD;
  if (s > MasteryThresholds.DEVELOPING_MAX) return MasteryLevel.DEVELOPING;
  if (s > MasteryThresholds.WEAK_MAX) return MasteryLevel.WEAK;
  return MasteryLevel.NEEDS_INTERVENTION;
}

export function isWeakLevel(level: MasteryLevel): boolean {
  return level === MasteryLevel.NEEDS_INTERVENTION || level === MasteryLevel.WEAK;
}

@Injectable()
export class MasteryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates ConceptMastery rows using evidence derived from an attempt's answers.
   * Returns the per-concept results (including weakness flag).
   *
   * `source` says where the evidence came from: an assessment attempt, a practice
   * session, or both. Writing a practice id into the assessment-attempt foreign key
   * made every practice submit fail with a foreign-key error.
   */
  async applyAttemptEvidence(
    studentId: string,
    source: { attemptId?: string | null; practiceSetId?: string | null },
    conceptEvidence: Array<{ conceptId: string; questions: number; correct: number }>,
  ): Promise<Array<{ conceptId: string; score: number; combinedScore: number; level: MasteryLevel; weak: boolean; evidenceCount: number }>> {
    const results: Array<{ conceptId: string; score: number; combinedScore: number; level: MasteryLevel; weak: boolean; evidenceCount: number }> = [];

    for (const ev of conceptEvidence) {
      if (!ev.conceptId || ev.questions <= 0) continue;
      const score = Math.round((ev.correct / ev.questions) * 100);

      const existing = await this.prisma.conceptMastery.findUnique({
        where: { studentId_conceptId: { studentId, conceptId: ev.conceptId } },
      });

      const combinedCorrect = (existing?.correct ?? 0) + ev.correct;
      const combinedAttempts = (existing?.attempts ?? 0) + ev.questions;
      const combinedScore = Math.round((combinedCorrect / combinedAttempts) * 100);
      const level = masteryLevelForScore(combinedScore, combinedAttempts);

      await this.prisma.conceptMastery.upsert({
        where: { studentId_conceptId: { studentId, conceptId: ev.conceptId } },
        create: {
          studentId,
          conceptId: ev.conceptId,
          score: combinedScore,
          attempts: combinedAttempts,
          correct: combinedCorrect,
          evidenceCount: existing?.evidenceCount ?? ev.questions,
          level,
        },
        update: {
          score: combinedScore,
          attempts: combinedAttempts,
          correct: combinedCorrect,
          evidenceCount: { increment: ev.questions },
          level,
        },
      });

      await this.prisma.diagnosticResult.create({
        data: {
          studentId,
          conceptId: ev.conceptId,
          attemptId: source.attemptId ?? null,
          practiceSetId: source.practiceSetId ?? null,
          score,
          attempts: ev.questions,
          correct: ev.correct,
          level,
          evidence: ev.questions >= MASTERY_EVIDENCE_MIN_QUESTIONS ? 'SUFFICIENT' : 'INSUFFICIENT',
        },
      });

      results.push({ conceptId: ev.conceptId, score, combinedScore, level, weak: isWeakLevel(level), evidenceCount: combinedAttempts });
    }
    return results;
  }

  isObjectiveType(type: string): boolean {
    if (type === 'NUMERICAL') return false;
    return getQuestionCategory(type as Parameters<typeof getQuestionCategory>[0]) === 'OBJECTIVE';
  }

  gradeAssessmentQuestion(q: GradableQuestion, rawAnswer: string | null) {
    return gradeObjectiveResponse(q, rawAnswer);
  }
}