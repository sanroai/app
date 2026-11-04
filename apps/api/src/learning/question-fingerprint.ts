/**
 * A fingerprint that answers "is this the same question, worded differently?".
 *
 * The bank holds a handful of questions that were authored twice - "What is the
 * degree of the polynomial 4x^3 - 2x + 7?" and "The degree of the polynomial
 * 4x^3 - 2x + 7 is:" ask the same thing. Two of them inside one practice set is
 * the same question twice: it looks like a bug to the student and produces no
 * second piece of evidence. Across sets they are harmless, even useful - the same
 * idea recalled in different words is real practice - so this is used to filter a
 * *set*, never to reject a question from the bank.
 *
 * Two questions match when their content words agree as a multiset, ignoring
 * word order and the words that carry no meaning ("what is", "the", "a"). Numbers
 * are kept, so questions that differ only by their figures stay distinct
 * (6:40-8:15 is not 6:15-8:00), and brackets are kept, so `3 + 4 x 2` is not
 * `(3 + 4) x 2` - both traps showed up in the bank.
 */
const MEANINGLESS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'of', 'in', 'on', 'at', 'to',
  'for', 'and', 'or', 'which', 'what', 'who', 'when', 'where', 'that', 'this',
  'these', 'those', 'it', 'its', 'as', 'by', 'with', 'from', 'following', 'give',
  'gives', 'given', 'find', 'value', 'question', 'all',
]);

const SYMBOLS = new Set(['(', ')', '+', '-', '/', '^', '%', '=', '<', '>']);

export function questionFingerprint(text: string): string {
  const normalised = String(text ?? '')
    .toLowerCase()
    .replace(/[²]/g, '^2')
    .replace(/[³]/g, '^3')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9()+\-/^%=<>]+/g, ' ');

  const tokens = normalised
    .split(' ')
    .map((token) => token.replace(/[.,;:!?]/g, ''))
    .filter((token) => token.length > 0)
    .filter((token) => SYMBOLS.has(token) || !MEANINGLESS.has(token));

  return tokens.sort().join(' ');
}

/** Orders a list so that no two entries share a fingerprint, keeping the first. */
export function withoutRepeats<T extends { text: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const kept: T[] = [];
  for (const item of list) {
    const key = questionFingerprint(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(item);
  }
  return kept;
}
