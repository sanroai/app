import { describe, expect, it } from 'vitest';
import { SUGGESTED_ANSWERS, buildGroundedAnswer, normaliseQuestion } from './grounded-answer';

const notes = [
  {
    title: 'Photosynthesis - Study notes',
    body: [
      '# Photosynthesis',
      'Green plants use sunlight, water and carbon dioxide to make glucose and oxygen.',
      '6CO2 + 6H2O = C6H12O6 + 6O2',
      'Chlorophyll absorbs light in the chloroplast.',
    ].join('\n'),
  },
];

describe('normaliseQuestion', () => {
  it('lower-cases and strips punctuation so chips match exactly', () => {
    expect(normaliseQuestion("  What is Ohm's law? ")).toBe('what is ohm s law');
  });
});

describe('buildGroundedAnswer', () => {
  it('answers from the open concept notes', () => {
    const reply = buildGroundedAnswer('Explain photosynthesis in simple terms', {
      conceptName: 'Photosynthesis',
      notes,
    });
    expect(reply).not.toBeNull();
    expect(reply?.reply).toContain('Green plants use sunlight');
    expect(reply?.reply).toMatch(/^\*\*Photosynthesis\*\*/);
    expect(reply?.reply).toContain('**Takeaway**');
  });

  it('refuses to answer about a different topic from these notes', () => {
    // The student is reading about life processes but asks about the reactivity
    // series: reusing the open notes here would be a confidently wrong answer.
    expect(
      buildGroundedAnswer('Explain the reactivity series', {
        conceptName: 'Nutrition in Plants',
        chapterName: 'Life Processes',
        notes,
      }),
    ).toBeNull();
  });

  it('pulls the equations out for a formula question', () => {
    const reply = buildGroundedAnswer('What are the key formulas for photosynthesis?', {
      conceptName: 'Photosynthesis',
      notes,
    });
    expect(reply?.reply).toContain('6CO2 + 6H2O = C6H12O6 + 6O2');
    expect(reply?.reply).toContain('**Key formulas and equations**');
  });

  it('answers a practice request without inventing questions', () => {
    const reply = buildGroundedAnswer('Give me practice problems on photosynthesis', {
      conceptName: 'Photosynthesis',
      chapterName: 'Life Processes',
      chapterConcepts: ['Photosynthesis', 'Respiration'],
      notes,
    });
    expect(reply?.reply).toContain('**Practise it, do not just read it**');
    expect(reply?.reply).toContain('Photosynthesis');
    expect(reply?.reply).toContain('5 XP');
  });

  it('answers a chapter overview from the chapter data', () => {
    const reply = buildGroundedAnswer('Summarise this chapter', {
      chapterName: 'Life Processes',
      chapterDescription: 'Nutrition, respiration, transportation and excretion.',
      chapterConcepts: ['Photosynthesis', 'Respiration', 'Transportation'],
    });
    expect(reply?.reply).toContain('Nutrition, respiration');
    expect(reply?.reply).toContain('**What this chapter covers**');
  });

  it('returns null with no context at all', () => {
    expect(buildGroundedAnswer('Explain photosynthesis')).toBeNull();
  });

  it('returns null for an empty message', () => {
    expect(buildGroundedAnswer('   ', { conceptName: 'Photosynthesis', notes })).toBeNull();
  });
});

describe('SUGGESTED_ANSWERS', () => {
  it('covers every chip the apps show', () => {
    const chips = [
      'Explain the reactivity series simply',
      'Why is methane a covalent compound?',
      'How do I balance chemical equations?',
      'Give me 5 questions on acids and bases',
      'What is Ohms law with a real example?',
      'Summarise the chapter on life processes',
      'How do I improve my score?',
    ];
    for (const chip of chips) {
      expect(SUGGESTED_ANSWERS[normaliseQuestion(chip)], chip).toBeTruthy();
    }
  });

  it('formats every answer with a bold title and a takeaway', () => {
    for (const [question, answer] of Object.entries(SUGGESTED_ANSWERS)) {
      expect(answer.startsWith('**'), question).toBe(true);
      expect(answer, question).toMatch(/\*\*(Takeaway|The rule|Evidence|What happens|Why it matters)/);
      expect(answer, question).not.toContain('\\frac');
    }
  });
});
