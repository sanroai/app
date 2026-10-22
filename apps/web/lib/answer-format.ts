/**
 * Answer helpers shared by the practice and assessment screens.
 *
 * The API grades the answers it has stored:
 * - MCQ / TRUE_FALSE / FILL_BLANK: the option TEXT (see `normaliseAnswerToOptionText`)
 * - MULTI_SELECT: a JSON array of the selected option texts
 *   (see `gradeObjectiveResponse` in `apps/api/src/diagnosis/mastery.service.ts`)
 *
 * Written answers (SHORT_ANSWER, LONG_ANSWER, ...) are NOT auto-graded: they are
 * excluded from the score and reviewed by a teacher.
 */

/** Question types the API grades automatically (mirrors `MasteryService.isObjectiveType`). */
const AUTO_GRADED_TYPES = new Set(['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'FILL_BLANK']);

export function isAutoGradedType(type: string | null | undefined): boolean {
  return !!type && AUTO_GRADED_TYPES.has(type);
}

export function isMultiSelectType(type: string | null | undefined): boolean {
  return type === 'MULTI_SELECT';
}

/**
 * Reads a MULTI_SELECT answer back into the list of selected option texts.
 * Tolerates a plain (non-JSON) value by returning an empty list, which is what
 * the API does with an unparsable answer.
 */
export function parseMultiSelectAnswer(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => String(entry)).filter((entry) => entry.length > 0);
  } catch {
    return [];
  }
}

/** `["A","B"]` -> `"A, B"` (for the "your answer" line). */
export function formatMultiSelectAnswer(value: string | null | undefined): string {
  return parseMultiSelectAnswer(value).join(', ');
}

/**
 * The API stores the canonical answer of a MULTI_SELECT question as the correct
 * option texts joined by "||" (see `canonicalAnswer` in assessment.snapshot.ts).
 */
export function parseJoinedAnswer(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split('||')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** `"A||B"` -> `"A, B"`. */
export function formatJoinedAnswer(value: string | null | undefined): string {
  return parseJoinedAnswer(value).join(', ');
}

/** Toggles one option inside a MULTI_SELECT answer and returns the new JSON payload. */
export function toggleMultiSelectAnswer(
  current: string | null | undefined,
  optionText: string,
): string {
  const selected = parseMultiSelectAnswer(current);
  const next = selected.includes(optionText)
    ? selected.filter((entry) => entry !== optionText)
    : [...selected, optionText];
  return JSON.stringify(next);
}
