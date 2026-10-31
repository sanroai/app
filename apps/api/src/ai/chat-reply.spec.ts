import { describe, expect, it } from 'vitest';
import { finalizeChatReply, TRUNCATION_MARKER } from './chat-reply';

/**
 * The reported bug: a long AI explanation stopped mid-sentence with no
 * indication that it had been cut. The output cap is now large (4096) but a
 * bounded model still hits it, so a truncated answer must say so - and the flag
 * it returns is what lets both clients offer "Continue" instead of making the
 * student retype the question.
 */
describe('finalizeChatReply', () => {
  const answer = 'Photosynthesis has two stages:\n\n1. Light reactions';

  it('leaves a complete answer untouched', () => {
    const result = finalizeChatReply(answer, 'STOP');
    expect(result).toEqual({ reply: answer, truncated: false });
  });

  it('treats a missing finish reason as complete', () => {
    expect(finalizeChatReply(answer, null)).toEqual({ reply: answer, truncated: false });
    expect(finalizeChatReply(answer, undefined)).toEqual({ reply: answer, truncated: false });
  });

  it('marks a MAX_TOKENS answer as shortened', () => {
    const result = finalizeChatReply(answer, 'MAX_TOKENS');
    expect(result.truncated).toBe(true);
    expect(result.reply.startsWith(answer)).toBe(true);
    expect(result.reply).toContain(TRUNCATION_MARKER);
  });

  it('never repeats the marker', () => {
    const once = finalizeChatReply(answer, 'MAX_TOKENS');
    expect(once.reply.split(TRUNCATION_MARKER)).toHaveLength(2);
  });

  it('is case sensitive about the provider value', () => {
    expect(finalizeChatReply(answer, 'max_tokens').truncated).toBe(false);
  });
});
