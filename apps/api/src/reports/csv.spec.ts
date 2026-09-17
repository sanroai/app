import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('returns empty string for no rows', () => {
    expect(toCsv([])).toBe('');
  });

  it('serializes headers and values', () => {
    const csv = toCsv([{ name: 'Aarav', score: 72 }]);
    expect(csv).toBe('name,score\r\nAarav,72');
  });

  it('quotes fields containing commas, quotes and newlines', () => {
    const csv = toCsv([{ concept: 'Light, Reflection', note: 'He said "focus"' }]);
    expect(csv).toContain('"Light, Reflection"');
    expect(csv).toContain('"He said ""focus"""');
  });

  it('renders null as empty', () => {
    const csv = toCsv([{ a: null, b: undefined, c: 0 }]);
    expect(csv).toBe('a,b,c\r\n,,0');
  });
});