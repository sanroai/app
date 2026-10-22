import { resolveAchievement } from './visuals';

describe('resolveAchievement (BUG-K: empty badge glyph)', () => {
  it('maps the seeded "zap" icon (Week Warrior) to a real 3D asset', () => {
    expect(resolveAchievement('zap').icon).toBe('sparkles');
  });

  it('maps the seeded "clock" icon (Speed Demon) to a real 3D asset', () => {
    expect(resolveAchievement('clock').icon).toBe('hourglass');
  });

  it('falls back to a real asset for a completely unknown icon', () => {
    // Previously the fuzzy matcher self-matched (`'zzz'.includes('zzz')`), returned the
    // unknown key, and Icon3D rendered null -> an empty square.
    expect(resolveAchievement('not-a-real-icon').icon).toBe('glowing-star');
  });

  it('falls back for null/empty icons', () => {
    expect(resolveAchievement(null).icon).toBe('glowing-star');
    expect(resolveAchievement(undefined).icon).toBe('glowing-star');
    expect(resolveAchievement('').icon).toBe('glowing-star');
  });

  it('preserves existing correct mappings', () => {
    expect(resolveAchievement('star').icon).toBe('star');
    expect(resolveAchievement('flame').icon).toBe('fire');
    expect(resolveAchievement('clipboard').icon).toBe('clipboard');
    expect(resolveAchievement('book').icon).toBe('books');
    expect(resolveAchievement('brain').icon).toBe('brain');
    expect(resolveAchievement('trophy').icon).toBe('trophy');
  });

  it('is case-insensitive', () => {
    expect(resolveAchievement('ZAP').icon).toBe('sparkles');
    expect(resolveAchievement('Flame').icon).toBe('fire');
  });

  it('always returns a non-empty icon name', () => {
    for (const input of ['zap', 'clock', 'zap', 'garbage', null, '', 'star']) {
      expect(resolveAchievement(input).icon).toBeTruthy();
    }
  });
});
