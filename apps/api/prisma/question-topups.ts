/**
 * Extra practice questions for the chapters that only had three.
 *
 * A chapter with three questions gives a three-question practice set, which is
 * too short to move mastery (it needs at least three evidence questions on the
 * *same* concept) and makes a "chapter practice" feel like a quiz fragment. These
 * are authored from the chapter's own concepts, four per chapter, and merged into
 * the seed by `seed.ts`.
 */

type TopupQuestion = {
  grade: string;
  subject: 'MATHS' | 'SCIENCE';
  chapterName: string;
  spec: {
    type: 'MCQ' | 'SHORT_ANSWER';
    text: string;
    answer: string;
    marks: number;
    options?: { text: string; isCorrect: boolean }[];
  };
};

const mcq = (text: string, correct: string, wrong: string[]): TopupQuestion['spec'] => ({
  type: 'MCQ',
  text,
  answer: correct,
  marks: 1,
  options: [correct, ...wrong].map((option) => ({ text: option, isCorrect: option === correct })),
});

const short = (text: string, answer: string): TopupQuestion['spec'] => ({
  type: 'SHORT_ANSWER',
  text,
  answer,
  marks: 2,
});

export const TOPUP_QUESTIONS: TopupQuestion[] = [
  // ── Class 6 Mathematics: Symmetry ────────────────────────────────────────
  {
    grade: '6',
    subject: 'MATHS',
    chapterName: 'Symmetry',
    spec: mcq('Which of these letters has a vertical line of symmetry?', 'A', ['F', 'G', 'J']),
  },
  {
    grade: '6',
    subject: 'MATHS',
    chapterName: 'Symmetry',
    spec: mcq('How many lines of symmetry does a square have?', '4', ['2', '3', '8']),
  },
  {
    grade: '6',
    subject: 'MATHS',
    chapterName: 'Symmetry',
    spec: short('A figure has rotational symmetry of order 4. What is its angle of rotation?', '90° (360° ÷ 4)'),
  },
  {
    grade: '6',
    subject: 'MATHS',
    chapterName: 'Symmetry',
    spec: short('Why does a circle have infinitely many lines of symmetry?', 'Because every diameter is a line of symmetry.'),
  },

  // ── Class 8 Mathematics: A Square and A Cube ─────────────────────────────
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Square and A Cube',
    spec: mcq('Which of these is a perfect square?', '144', ['120', '132', '150']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Square and A Cube',
    spec: mcq('The cube of 5 is:', '125', ['25', '75', '625']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Square and A Cube',
    spec: short('Find the square root of 729.', '27'),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Square and A Cube',
    spec: short(
      'What is a taxicab number?',
      'A number that can be written as the sum of two positive cubes in more than one way, such as 1729 = 1³ + 12³ = 9³ + 10³.',
    ),
  },

  // ── Class 8 Mathematics: A Story of Numbers ──────────────────────────────
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Story of Numbers',
    spec: mcq('The Roman numeral for 90 is:', 'XC', ['LX', 'CX', 'LXXXX']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Story of Numbers',
    spec: mcq('The base-5 number 23 equals which decimal number?', '13', ['8', '10', '23']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Story of Numbers',
    spec: short('Write 42 in Roman numerals.', 'XLII'),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'A Story of Numbers',
    spec: short(
      'Why did early people count in groups?',
      'Because groups such as tallies in fives or tens are quicker to record and to read than a long row of single marks.',
    ),
  },

  // ── Class 8 Mathematics: Power Play ──────────────────────────────────────
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'Power Play',
    spec: mcq('3⁴ equals:', '81', ['12', '27', '64']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'Power Play',
    spec: mcq('10⁻³ equals:', '0.001', ['0.003', '0.1', '1000']),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'Power Play',
    spec: short('Simplify 2⁵ × 2³ using the laws of exponents.', '2⁸ = 256'),
  },
  {
    grade: '8',
    subject: 'MATHS',
    chapterName: 'Power Play',
    spec: short('Write 4,500,000 in scientific notation.', '4.5 × 10⁶'),
  },

  // ── Class 8 Science: Exploring the Investigative World of Science ────────
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Exploring the Investigative World of Science',
    spec: mcq('In a fair test, how many variables should you change at a time?', 'One', ['Two', 'Three', 'As many as you like']),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Exploring the Investigative World of Science',
    spec: mcq('The variable you deliberately change is called the:', 'independent variable', [
      'dependent variable',
      'controlled variable',
      'constant',
    ]),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Exploring the Investigative World of Science',
    spec: short(
      'Why should a measurement include a unit?',
      'Because the number alone does not say what was measured - 5 could be 5 cm or 5 m.',
    ),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Exploring the Investigative World of Science',
    spec: short(
      'What is a controlled variable?',
      'A condition kept the same in every trial so that the effect of the changed variable can be seen.',
    ),
  },

  // ── Class 8 Science: Health - The Ultimate Treasure ──────────────────────
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Health: The Ultimate Treasure',
    spec: mcq('Which of these is a communicable disease?', 'Dengue', ['Diabetes', 'Asthma', 'Cancer']),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Health: The Ultimate Treasure',
    spec: mcq('Antibiotics are effective against:', 'Bacteria', ['Viruses', 'All diseases', 'Vitamin deficiency']),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Health: The Ultimate Treasure',
    spec: short(
      'What is the difference between a sign and a symptom?',
      'A sign can be seen or measured by others, such as fever or a rash; a symptom is what the patient feels, such as pain or tiredness.',
    ),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'Health: The Ultimate Treasure',
    spec: short(
      'Why does not completing a course of antibiotics cause resistance?',
      'The strongest bacteria survive a partial dose and multiply, so the infection becomes harder to treat.',
    ),
  },

  // ── Class 8 Science: The Invisible Living World ──────────────────────────
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'The Invisible Living World: Beyond Our Naked Eye',
    spec: mcq('Which part of the cell controls all its activities?', 'Nucleus', ['Cell membrane', 'Cytoplasm', 'Vacuole']),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'The Invisible Living World: Beyond Our Naked Eye',
    spec: mcq('Which structure is found only in plant cells?', 'Cell wall', ['Cell membrane', 'Nucleus', 'Cytoplasm']),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'The Invisible Living World: Beyond Our Naked Eye',
    spec: short(
      'Put these in order from smallest to largest: organ, cell, tissue, organ system.',
      'cell → tissue → organ → organ system',
    ),
  },
  {
    grade: '8',
    subject: 'SCIENCE',
    chapterName: 'The Invisible Living World: Beyond Our Naked Eye',
    spec: short(
      'Name two useful jobs done by microorganisms.',
      'Making curd and bread, decomposing waste, and fixing nitrogen in the soil (any two).',
    ),
  },
];

/** Question text -> the concept it belongs to (the seed requires a mapping). */
export const TOPUP_QUESTION_CONCEPTS: Record<string, string> = {
  'Which of these letters has a vertical line of symmetry?': 'Line of Symmetry',
  'How many lines of symmetry does a square have?': 'Line of Symmetry',
  'A figure has rotational symmetry of order 4. What is its angle of rotation?': 'Angle of Symmetry',
  'Why does a circle have infinitely many lines of symmetry?': 'Symmetry of a Circle',

  'Which of these is a perfect square?': 'Perfect Squares',
  'The cube of 5 is:': 'Perfect Cubes and Cube Roots',
  'Find the square root of 729.': 'Perfect Squares',
  'What is a taxicab number?': 'Taxicab Numbers',

  'The Roman numeral for 90 is:': 'Roman Numerals',
  'The base-5 number 23 equals which decimal number?': 'Base-n Number Systems',
  'Write 42 in Roman numerals.': 'Roman Numerals',
  'Why did early people count in groups?': 'Tally Marks and Counting in Groups',

  '3⁴ equals:': 'Powers and Exponential Form',
  '10⁻³ equals:': 'Zero and Negative Exponents',
  'Simplify 2⁵ × 2³ using the laws of exponents.': 'Laws of Exponents',
  'Write 4,500,000 in scientific notation.': 'Powers of 10 and Scientific Notation',

  'In a fair test, how many variables should you change at a time?': 'Controlled Variables in an Experiment',
  'The variable you deliberately change is called the:': 'Asking a Scientific Question',
  'Why should a measurement include a unit?': 'Careful Observation',
  'What is a controlled variable?': 'Controlled Variables in an Experiment',

  'Which of these is a communicable disease?': 'Communicable and Non-communicable Diseases',
  'Antibiotics are effective against:': 'Vaccines, Antibiotics and Antibiotic Resistance',
  'What is the difference between a sign and a symptom?': 'Communicable and Non-communicable Diseases',
  'Why does not completing a course of antibiotics cause resistance?':
    'Vaccines, Antibiotics and Antibiotic Resistance',

  'Which part of the cell controls all its activities?': 'Cell Membrane, Cytoplasm and Nucleus',
  'Which structure is found only in plant cells?': 'Cell Wall, Plastids and Vacuole',
  'Put these in order from smallest to largest: organ, cell, tissue, organ system.':
    'Levels of Organisation from Cell to Organism',
  'Name two useful jobs done by microorganisms.': 'Microorganisms and the Work They Do',
};
