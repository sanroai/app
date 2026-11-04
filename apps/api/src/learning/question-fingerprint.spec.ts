import { describe, expect, it } from 'vitest';
import { questionFingerprint, withoutRepeats } from './question-fingerprint';

describe('questionFingerprint', () => {
  it('treats the same question worded differently as one question', () => {
    expect(questionFingerprint('What is the degree of the polynomial 4x^3 - 2x + 7?')).toBe(
      questionFingerprint('The degree of the polynomial 4x^3 - 2x + 7 is:'),
    );
    expect(questionFingerprint('Which part of the cell controls all its activities?')).toBe(
      questionFingerprint('Which part of the cell controls its activities?'),
    );
    expect(questionFingerprint('What is the area of a square of side 9 cm?')).toBe(
      questionFingerprint('The area of a square of side 9 cm is'),
    );
  });

  it('keeps questions that differ only by their figures', () => {
    expect(questionFingerprint('A film starts at 6:40 p.m. and ends at 8:15 p.m. How long is it?')).not.toBe(
      questionFingerprint('A film starts at 6:15 p.m. and ends at 8:00 p.m. How long is it?'),
    );
    expect(questionFingerprint('A triangle has a base of 12 cm and a height of 7 cm. What is its area?')).not.toBe(
      questionFingerprint('A triangle has base 12 cm and height 3 cm. Its area is'),
    );
  });

  it('keeps brackets, because they change the answer', () => {
    expect(questionFingerprint('What is the value of 3 + 4 x 2?')).not.toBe(
      questionFingerprint('What is the value of (3 + 4) x 2?'),
    );
  });

  it('is stable across typographic quotes, powers and multiplication signs', () => {
    expect(questionFingerprint('The roots of x² - 5x + 6 = 0 are:')).toBe(
      questionFingerprint('The roots of x^2 - 5x + 6 = 0 are:'),
    );
    expect(questionFingerprint('What is 6 × 7?')).toBe(questionFingerprint('What is 6 x 7?'));
    expect(questionFingerprint('Anne’s diary was called Kitty')).toBe(
      questionFingerprint("Anne's diary was called Kitty"),
    );
  });

  it('matches nothing to nothing without throwing', () => {
    expect(questionFingerprint('')).toBe('');
    expect(questionFingerprint(undefined as unknown as string)).toBe('');
  });
});

describe('withoutRepeats', () => {
  it('keeps the first of two questions that ask the same thing', () => {
    const list = [
      { id: 'a', text: 'What is the degree of the polynomial 4x^3 - 2x + 7?' },
      { id: 'b', text: 'The degree of the polynomial 4x^3 - 2x + 7 is:' },
      { id: 'c', text: 'What is the value of (3 + 4) x 2?' },
    ];
    expect(withoutRepeats(list).map((item) => item.id)).toEqual(['a', 'c']);
  });

  it('leaves a list with no repeats untouched', () => {
    const list = [
      { id: 'a', text: 'Name the gas released when zinc reacts with dilute hydrochloric acid.' },
      { id: 'b', text: 'State the law of conservation of mass.' },
    ];
    expect(withoutRepeats(list)).toHaveLength(2);
  });
});
