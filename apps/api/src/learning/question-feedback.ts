/**
 * What a student reads after answering a practice question.
 *
 * Corrective feedback is the single strongest lever in the evidence base
 * (d ~ 0.73) and the platform used to return one sentence for all 3,335
 * questions - "Refer to the chapter notes for the detailed solution." - which
 * told a student nothing they did not already know.
 *
 * An explanation now comes from one of three places, in this order:
 *
 *   authored - the question carries its own explanation (the goal, enforced by
 *              `scripts/qa/validate-question-fragments.mjs`)
 *   notes    - the sentence of the concept's or chapter's lesson notes that
 *              actually supports the answer, quoted verbatim
 *   answer   - a last-resort restatement of the answer plus what the question
 *              is testing; honest about being thin
 *
 * The `source` is returned so an audit can count how many questions still rely
 * on the fallbacks - that number is the authoring backlog, not a hidden failure.
 */

/** The sentence the seed wrote on every question before explanations existed. */
export const LEGACY_EXPLANATION = 'Refer to the chapter notes for the detailed solution.';

/** An explanation shorter than this cannot teach anything. */
const MIN_AUTHORED_LENGTH = 30;

/** A quoted notes sentence outside this range is either a fragment or a wall. */
const MIN_QUOTE_LENGTH = 25;
const MAX_QUOTE_LENGTH = 420;

/** The score a notes sentence must reach to be quoted. */
const MIN_QUOTE_SCORE = 4;

export type FeedbackSource = 'authored' | 'notes' | 'answer';

export interface FeedbackQuestion {
  id: string;
  type: string;
  text: string;
  answer: string;
  explanation: string | null;
  conceptId?: string | null;
  chapterId?: string | null;
}

export interface FeedbackContext {
  conceptName?: string | null;
  chapterName?: string | null;
  /** The concept's own notes first, then the chapter's. */
  notes: string[];
}

export interface QuestionFeedback {
  explanation: string;
  source: FeedbackSource;
}

const STOPWORDS = new Set(
  `the a an and or of to in on for with is are was were be been being that this these those it its as at by
   from not no but if then than so such can could should would may might must has have had do does did their
   they them there here which who whom what when where why how all any both each few more most other some
   only own same too very just also into over under about above below between while during before after
   you your yours we our ours he she his her him one two three first second`
    .split(/\s+/)
    .filter(Boolean),
);

/** Meaningful words of a text, lower-cased and de-duplicated. */
function termsOf(value: string | null | undefined): Set<string> {
  const words = (value ?? '').toLowerCase().match(/[a-z][a-z0-9]{3,}/g) ?? [];
  return new Set(words.filter((word) => !STOPWORDS.has(word)));
}

/** Markdown emphasis is noise inside a quoted sentence. */
function plainSentence(value: string): string {
  return value
    .replace(/[*_`#>]+/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The sentences of a notes document, longest-lived markdown stripped. */
function sentencesOf(notes: string[]): string[] {
  const out: string[] = [];
  for (const note of notes) {
    if (!note) continue;
    const cleaned = note.replace(/\r/g, '').replace(/\n+/g, '\n');
    for (const rawLine of cleaned.split('\n')) {
      const line = rawLine.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').trim();
      if (!line) continue;
      // A heading on its own is not a sentence, but keep it as a short candidate
      // so a bullet list of definitions still yields a quotable line.
      const parts = line.split(/(?<=[.!?])\s+/);
      for (const part of parts) {
        const sentence = plainSentence(part);
        if (sentence.length >= MIN_QUOTE_LENGTH && sentence.length <= MAX_QUOTE_LENGTH) {
          out.push(sentence);
        }
      }
    }
  }
  return out;
}

/**
 * Pick the notes sentence that best supports the answer.
 *
 * The answer carries the most weight (a sentence that mentions the answer is
 * about the answer), then the concept name, then the question wording - so a
 * generic sentence of the chapter cannot outrank the one line that explains the
 * option the student just chose.
 */
function bestNotesSentence(question: FeedbackQuestion, context: FeedbackContext): string | null {
  const answer = termsOf(question.answer);
  const concept = termsOf(context.conceptName);
  const wording = termsOf(question.text);
  if (answer.size === 0 && concept.size === 0) return null;

  let best: { sentence: string; score: number } | null = null;
  for (const sentence of sentencesOf(context.notes)) {
    const terms = termsOf(sentence);
    let score = 0;
    for (const term of terms) {
      if (answer.has(term)) score += 3;
      else if (concept.has(term)) score += 2;
      else if (wording.has(term)) score += 1;
    }
    if (!best || score > best.score) best = { sentence, score };
  }

  return best && best.score >= MIN_QUOTE_SCORE ? best.sentence : null;
}

/** Restate the answer without pretending to explain it. */
function answerOnlyExplanation(question: FeedbackQuestion, context: FeedbackContext): string {
  const concept = context.conceptName?.trim();
  const chapter = context.chapterName?.trim();
  const where = concept
    ? chapter
      ? `**${concept}** (${chapter})`
      : `**${concept}**`
    : chapter
      ? `**${chapter}**`
      : null;

  const parts = [`The answer is **${question.answer.trim()}**.`];
  if (where) parts.push(`This question is checking ${where}.`);
  parts.push(
    question.type === 'MCQ'
      ? 'Read the lesson notes and work out why every other option is wrong - that is what the exam will ask.'
      : 'Read the lesson notes for the reasoning, then try the question again.',
  );
  return parts.join(' ');
}

/**
 * Resolve the feedback a student should see for one question.
 */
export function resolveQuestionFeedback(
  question: FeedbackQuestion,
  context: FeedbackContext,
): QuestionFeedback {
  const authored = question.explanation?.trim();
  if (
    authored &&
    authored !== LEGACY_EXPLANATION &&
    authored.length >= MIN_AUTHORED_LENGTH
  ) {
    return { explanation: authored, source: 'authored' };
  }

  const quote = bestNotesSentence(question, context);
  if (quote) return { explanation: quote, source: 'notes' };

  return { explanation: answerOnlyExplanation(question, context), source: 'answer' };
}
