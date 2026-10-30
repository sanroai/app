/**
 * Turning a raw model response into the chat reply the clients render.
 *
 * The provider's `finishReason` is the only reliable signal that the answer was
 * cut off at `maxOutputTokens`: the text itself just stops, often mid-list, and
 * a student cannot tell a short answer from a truncated one. This lives in its
 * own module so the rule can be unit tested without a provider or a database.
 */
export const TRUNCATION_MARKER = '_(Answer shortened - tap Continue for the rest.)_';

export function finalizeChatReply(
  content: string,
  finishReason: string | null | undefined,
): { reply: string; truncated: boolean } {
  const truncated = finishReason === 'MAX_TOKENS';
  return {
    reply: truncated ? `${content}\n\n${TRUNCATION_MARKER}` : content,
    truncated,
  };
}
