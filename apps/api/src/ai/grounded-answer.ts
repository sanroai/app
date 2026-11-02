/**
 * Deterministic, book-first answers for Sanro AI.
 *
 * Two problems this solves:
 *
 * 1. **Speed.** The tutor used to always wait for a remote model (3-6 s warm,
 *    up to 45 s cold). Most questions a student actually asks are about the
 *    concept or chapter already open, and the answer is sitting in the lesson
 *    notes we already hold. Those are now answered from the book with no network
 *    call at all.
 * 2. **Quota and errors.** The free Gemini tier answers ~20 requests a day. Once
 *    it is exhausted every reply became "Something went wrong". A grounded answer
 *    cannot fail, so the tutor keeps working when the model cannot.
 *
 * Ordering is deliberate and matches the product rule: **the book first, the
 * wider world second.** A question is only grounded when it actually names the
 * open concept/chapter (or asks generically about "this concept"), so a student
 * asking about the reactivity series while reading about life processes still
 * gets a real answer from the model instead of a mismatched excerpt.
 *
 * Pure functions only - no Prisma, no network - so the rules are unit testable.
 */

export interface GroundedContext {
  conceptName?: string;
  chapterName?: string;
  subjectName?: string;
  chapterConcepts?: string[];
  chapterDescription?: string;
  boardName?: string;
  grade?: string;
  /** The lesson material for the open concept/chapter, in markdown. */
  notes?: Array<{ title: string; body?: string | null }>;
}

export interface GroundedReply {
  reply: string;
  sources: string[];
}

/** Lower-case, punctuation-free, single-spaced - the form every rule matches on. */
export function normaliseQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'this', 'that', 'these', 'those', 'with', 'from', 'about', 'what', 'when', 'where',
  'which', 'while', 'have', 'has', 'does', 'doing', 'your', 'you', 'the', 'and', 'for',
  'are', 'was', 'were', 'can', 'could', 'would', 'should', 'please', 'explain', 'tell',
  'give', 'simple', 'simply', 'terms', 'mean', 'means', 'meaning', 'define', 'describe',
  'into', 'over', 'under', 'more', 'most', 'some', 'any', 'how', 'why', 'use', 'used',
  'make', 'made', 'work', 'works', 'does', 'did', 'there', 'their', 'them', 'then',
  'concept', 'chapter', 'topic', 'notes', 'lesson', 'key', 'main', 'example', 'examples',
]);

function words(text: string): string[] {
  return normaliseQuestion(text)
    .split(' ')
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

/**
 * True when the question is about the open concept/chapter.
 *
 * A bare "explain this concept" / "summarise this chapter" is always about the
 * open material; anything else has to share a meaningful word with its name.
 */
function aboutContext(question: string, ctx: GroundedContext): boolean {
  const q = normaliseQuestion(question);
  if (/\b(this|the) (concept|chapter|topic|lesson)\b/.test(q)) return true;
  // "Give me a practice problem" / "explain in simple terms" are about whatever is
  // open - the apps show them as chips on the concept page itself.
  if (/^(give me|show me|make me) (a |some )?(practice|question)/.test(q)) return true;
  if (/\b(in simple terms|simply|for this)\b/.test(q)) return true;

  const names = [
    ctx.conceptName,
    ctx.chapterName,
    ...(ctx.chapterConcepts ?? []),
  ].filter((name): name is string => Boolean(name));

  const nameWords = new Set(names.flatMap(words));
  if (!nameWords.size) return false;
  return words(question).some((word) => nameWords.has(word));
}

/** Cut at a sentence boundary so an excerpt never ends mid-word. */
function excerpt(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const cut = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('\n'));
  return `${(cut > max * 0.5 ? slice.slice(0, cut + 1) : slice).trim()}…`;
}

function firstNoteBody(ctx: GroundedContext): { title: string; body: string } | null {
  for (const note of ctx.notes ?? []) {
    if (note.body && note.body.trim()) return { title: note.title, body: note.body.trim() };
  }
  return null;
}

function heading(ctx: GroundedContext): string {
  const name = ctx.conceptName ?? ctx.chapterName ?? 'this topic';
  const where = [ctx.subjectName, ctx.grade ? `Class ${ctx.grade}` : null].filter(Boolean).join(' · ');
  return where ? `**${name}** _(${where})_` : `**${name}**`;
}

/**
 * A book answer for the question, or `null` when the book cannot answer it.
 *
 * `null` is the important return value: it sends the question on to the model,
 * which is what keeps the tutor honest instead of recycling the wrong notes.
 */
export function buildGroundedAnswer(message: string, ctx?: GroundedContext): GroundedReply | null {
  if (!ctx) return null;
  const q = normaliseQuestion(message);
  if (!q) return null;
  if (!aboutContext(message, ctx)) return null;

  const note = firstNoteBody(ctx);
  const sources = [ctx.conceptName ?? ctx.chapterName].filter((name): name is string => Boolean(name));

  // 1. Formulas - pulled out of the book text, not invented.
  if (/\bformula|formulae|equation/.test(q) && note) {
    const lines = note.body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && (/=/.test(line) || /\bformula\b/i.test(line)));
    if (lines.length) {
      return {
        reply: [
          heading(ctx),
          '',
          '**Key formulas and equations**',
          ...lines.slice(0, 12).map((line) => `- ${line.replace(/^[-*]\s*/, '')}`),
          '',
          `**Takeaway** — write each formula once from memory, then check it against the notes in _${note.title}_.`,
        ].join('\n'),
        sources,
      };
    }
  }

  // 2. Practice requests - point at the real practice set, never fake questions.
  if (/\bpractice|questions|exercise|worksheet|test me|quiz\b/.test(q)) {
    const concepts = (ctx.chapterConcepts ?? []).slice(0, 6);
    return {
      reply: [
        heading(ctx),
        '',
        '**Practise it, do not just read it**',
        concepts.length
          ? `This chapter's practice covers: ${concepts.map((name) => `**${name}**`).join(', ')}.`
          : 'Open the Practice tab on this concept to start a graded set.',
        '',
        '- Tap **Practice** on this page for a graded set with a timer.',
        '- Every correct answer is **5 XP**, and finishing adds **10 XP** more.',
        '- A wrong answer is the useful one: it tells us which concept to fix next.',
        '',
        '**Takeaway** — practise straight after reading, while the idea is still fresh.',
      ].join('\n'),
      sources,
    };
  }

  // 3. Chapter overview.
  if (/\bsummar|overview|chapter about|what.*chapter\b/.test(q)) {
    const lines: string[] = [heading(ctx), ''];
    if (ctx.chapterDescription) lines.push(excerpt(ctx.chapterDescription, 700), '');
    const concepts = ctx.chapterConcepts ?? [];
    if (concepts.length) {
      lines.push('**What this chapter covers**', ...concepts.slice(0, 10).map((name) => `- ${name}`), '');
    }
    if (note) lines.push(`**From the notes** — ${excerpt(note.body, 600)}`, '');
    lines.push('**Takeaway** — read the notes, watch the lesson, then run the chapter practice set.');
    return { reply: lines.join('\n'), sources };
  }

  // 4. Explanation - the book text is the explanation.
  if (note) {
    return {
      reply: [
        heading(ctx),
        '',
        excerpt(note.body, 1400),
        '',
        `**Takeaway** — this is the book's own explanation, from _${note.title}_. Ask a follow-up if any line needs unpacking.`,
      ].join('\n'),
      sources,
    };
  }

  // The chapter exists but has no written notes yet: still give the map.
  const concepts = ctx.chapterConcepts ?? [];
  if (concepts.length) {
    return {
      reply: [
        heading(ctx),
        '',
        'The written notes for this topic are still being prepared. Here is what it covers:',
        ...concepts.slice(0, 10).map((name) => `- ${name}`),
        '',
        '**Takeaway** — the lesson video above and the practice set cover the same ground.',
      ].join('\n'),
      sources,
    };
  }

  return null;
}

/**
 * Answers for the questions the apps put on screen as chips.
 *
 * These are asked by name, so they can be answered without a model: instant, no
 * quota, identical every time. Content is CBSE class 10 science (the suggested
 * chips) and the generic study-coaching prompts.
 */
export const SUGGESTED_ANSWERS: Record<string, string> = {
  'explain the reactivity series simply': [
    '**The reactivity series**',
    '',
    'The reactivity series lists metals from **most reactive to least reactive**. A metal higher in the list pushes a metal lower down out of its salt solution.',
    '',
    '**Order (common metals)**',
    'K > Na > Ca > Mg > Al > Zn > Fe > Pb > (H) > Cu > Hg > Ag > Au > Pt',
    '',
    '**Two rules that answer most exam questions**',
    '- **Displacement:** a more reactive metal displaces a less reactive one. Zn + CuSO₄ → ZnSO₄ + Cu (blue fades, red-brown copper forms).',
    '- **Acids:** metals **above hydrogen** displace H₂ from dilute acids. Copper, silver and gold do not.',
    '',
    '**Why it matters** — it predicts whether a reaction happens at all, which is what "will this react?" questions test.',
  ].join('\n'),

  'why is methane a covalent compound': [
    '**Why methane (CH₄) is covalent**',
    '',
    '**Carbon has 4 valence electrons** and needs 4 more to complete its octet. It cannot gain 4 electrons (too much energy, and the nucleus cannot hold them) and cannot lose 4 (too much energy). So it **shares** them instead.',
    '',
    '**What happens in CH₄**',
    '- One carbon atom shares its 4 electrons with **4 hydrogen atoms**, one pair per bond.',
    '- Four **C–H single bonds** form, each a shared pair — that is a covalent bond.',
    '- No ions are created, so the compound is a **discrete molecule**, not a lattice of ions.',
    '',
    '**Evidence you can quote**',
    '- Low melting and boiling points (weak forces between molecules).',
    '- Does not conduct electricity (no free ions).',
    '- Insoluble in water — it does not dissociate into ions.',
    '',
    '**Takeaway** — sharing electrons, not transferring them, is what makes a bond covalent; methane is the standard example.',
  ].join('\n'),

  'how do i balance chemical equations': [
    '**Balancing a chemical equation**',
    '',
    '**The rule** — matter is neither created nor destroyed, so the number of atoms of each element must be the same on both sides.',
    '',
    '**Steps**',
    '1. Write the correct **formulas** first (never change a formula to balance).',
    '2. Count the atoms of each element on both sides.',
    '3. Change only the **coefficients** (the numbers in front), never the subscripts.',
    '4. Balance the most complex compound first, then leave **H and O for last**.',
    '5. Recount every element and check.',
    '',
    '**Worked example**',
    'Fe + H₂O → Fe₃O₄ + H₂',
    '- Fe₃O₄ needs 3 Fe and 4 O, so put **3** before Fe and **4** before H₂O.',
    '- That gives 8 H on the left, so put **4** before H₂.',
    '- Balanced: **3Fe + 4H₂O → Fe₃O₄ + 4H₂**',
    '',
    '**Takeaway** — coefficients only, hydrogen and oxygen last, then recount.',
  ].join('\n'),

  'give me 5 questions on acids and bases': [
    '**5 questions on acids and bases**',
    '',
    '**1.** What ion is produced by an acid in water?',
    '_Answer: hydrogen ions, H⁺ (hydronium, H₃O⁺)._',
    '',
    '**2.** Which gas is produced when a dilute acid reacts with a metal?',
    '_Answer: hydrogen gas._',
    '',
    '**3.** What happens to the pH of a solution when it becomes more acidic?',
    '_Answer: it falls below 7 (7 is neutral)._',
    '',
    '**4.** Name the salt formed when hydrochloric acid reacts with sodium hydroxide.',
    '_Answer: sodium chloride (and water)._',
    '',
    '**5.** Why does a base neutralise an acid?',
    '_Answer: the base supplies OH⁻ ions that combine with H⁺ to form water._',
    '',
    '**Takeaway** — open Practice on this concept for a graded set with instant feedback and XP.',
  ].join('\n'),

  'what is ohms law with a real example': [
    "**Ohm's law**",
    '',
    'At **constant temperature**, the current through a conductor is directly proportional to the potential difference across it:',
    '',
    '**V = I × R**  (so I = V/R and R = V/I)',
    '',
    '**What each symbol means**',
    '- **V** — potential difference, in volts (V)',
    '- **I** — current, in amperes (A)',
    '- **R** — resistance, in ohms (Ω)',
    '',
    '**Real example** — a 12 V battery across a 4 Ω resistor:',
    'I = V/R = 12/4 = **3 A**',
    '',
    '**Exam detail** — the law holds only while the temperature stays constant. A bulb filament heats up, its resistance rises, and the V–I graph curves instead of staying straight.',
    '',
    '**Takeaway** — V = IR is the whole law; always state the constant-temperature condition.',
  ].join('\n'),

  'summarise the chapter on life processes': [
    '**Life processes — the four essentials**',
    '',
    '**1. Nutrition** — obtaining food. Plants use **photosynthesis** (sunlight + CO₂ + water → glucose + O₂); animals are heterotrophic and need a digestive system.',
    '',
    '**2. Respiration** — releasing energy from food. **Aerobic** uses oxygen and gives more energy (CO₂ + water); **anaerobic** gives less energy (yeast → alcohol + CO₂; muscles → lactic acid).',
    '',
    '**3. Transportation** — moving substances. Plants use **xylem** (water, upward) and **phloem** (food, both ways); humans use the **heart, blood and blood vessels**.',
    '',
    '**4. Excretion** — removing waste. Humans use the **kidneys** (urea); plants lose water and gases through stomata and leaves.',
    '',
    '**Takeaway** — every organism must gain energy, move it around, and get rid of waste; the exam asks you to compare how plants and animals do each one.',
  ].join('\n'),

  'how do i improve my score': [
    '**How to raise your score**',
    '',
    '**1. Fix the weakest concept first.** Open **Assessments → Path**; the concepts marked **weak** cost the most marks. One fixed concept is worth more than re-reading a chapter you already know.',
    '',
    '**2. Practise right after reading.** Practise while the idea is fresh, then retest later — spaced retests are what move a concept to **mastered**.',
    '',
    '**3. Read every explanation, right or wrong.** The explanation is where the exam technique lives.',
    '',
    '**4. Retest only after practice.** A retest with no practice just re-measures the same gap.',
    '',
    '**Takeaway** — weak concept → practice → retest → repeat. Your Path already orders this for you.',
  ].join('\n'),
};
