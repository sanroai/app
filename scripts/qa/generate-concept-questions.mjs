// Authors extra practice questions per concept through the live AI provider and
// writes them as question fragments for the existing validate -> merge pipeline.
//
//   node scripts/qa/generate-concept-questions.mjs --grades 10 --target 4 [--batch 5]
//                                                 [--max-calls 40] [--dir artifacts/qa/<date>]
//                                                 [--db sanro_dev] [--dry]
//
// Why a generator and not hand authoring: 1009 concepts carried 1045 questions - a
// student finishing one concept had one question to practise with. This tops every
// concept up to `--target` questions in batches (one call per `--batch` concepts,
// which keeps us under the free-tier rate limit), then the existing validators
// prove the output before anything touches the seed.
//
// The prompt is grounded per concept: grade, subject, chapter, topic, the concept
// name, and the text of the questions that concept already has (so the model
// extends the bank instead of rephrasing one question five times).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const GRADES = arg('--grades', '10').split(',').map((g) => g.trim()).filter(Boolean);
const TARGET = Number(arg('--target', '4'));
const BATCH = Number(arg('--batch', '5'));
const MAX_CALLS = Number(arg('--max-calls', '200'));
const DB = arg('--db', 'sanro_dev');
const DRY = argv.includes('--dry');
const date = new Date().toISOString().slice(0, 10);
const OUT_DIR = arg('--dir', path.join('artifacts', 'qa', date));
const MODEL = arg('--model', process.env.AI_MODEL ?? 'gemini-3-flash-preview');
const BASE_URL = process.env.AI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';

function readEnv() {
  for (const file of [path.join('apps', 'api', '.env'), '.env']) {
    if (!fs.existsSync(file)) continue;
    const values = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
    return values;
  }
  return {};
}

const env = readEnv();
const KEY = process.env.AI_API_KEY ?? env.AI_API_KEY ?? process.env.GEMINI_API_KEY ?? env.GEMINI_API_KEY;
if (!KEY) {
  console.error('AI_API_KEY missing (apps/api/.env)');
  process.exit(1);
}

process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${DB}`;
const prisma = new PrismaClient();

const SYSTEM = `You are a CBSE question author for Indian school students.
You write exam-accurate practice questions in the style of NCERT exercises and CBSE board papers.
Rules:
- Stay strictly inside the given chapter and concept. Never introduce another chapter's idea.
- MCQ questions have exactly four options and exactly one correct answer. The correct option text
  must be repeated verbatim in "answer".
- Distractors must be plausible misconceptions, not obviously wrong jokes.
- Vary the angle across questions: recall, understanding, application, and one numerical or
  reasoning step when the concept allows it.
- No question may repeat an existing question's wording or test exactly the same fact.
- Write in clear Indian English, no markdown, no numbering inside the text.
- Numbers and units follow CBSE conventions (SI units, ₹ for money).
Return JSON only.`;

function userPrompt(group) {
  const { grade, subject, chapter, topic, concept, existing } = group;
  return `Grade ${grade}, ${subject}, chapter "${chapter}", topic "${topic}", concept "${concept}".
${existing.length ? `This concept already has these questions:\n${existing.map((t) => `- ${t}`).join('\n')}` : 'This concept has no questions yet.'}
Write ${group.wanted} NEW questions for this concept.
Return:
{"questions":[{"concept":"${concept}","type":"MCQ","text":"...","options":[{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":false},{"text":"...","isCorrect":true}],"answer":"exact text of the correct option","explanation":"one or two sentences","difficulty":"EASY"}]}
"difficulty" is EASY, MEDIUM or HARD. Every question must keep "concept" exactly as "${concept}".`;
}

async function callModel(system, user, attempt = 0) {
  const res = await fetch(`${BASE_URL}/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (res.status === 429 && attempt < 4) {
    await new Promise((r) => setTimeout(r, 12000 * (attempt + 1)));
    return callModel(system, user, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gemini ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  return text.trim();
}

/** Parse the model's JSON, tolerating a code fence or a stray prefix. */
function parseQuestions(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed?.questions) ? parsed.questions : [];
  } catch {
    return [];
  }
}

/** A generated question is only usable if it satisfies the validator's contract. */
function cleanQuestion(raw, group) {
  if (!raw || typeof raw.text !== 'string') return null;
  const text = raw.text.trim();
  if (text.length < 12 || text.length > 400) return null;
  const options = Array.isArray(raw.options) ? raw.options : [];
  if (options.length !== 4) return null;
  const opts = options
    .filter((o) => o && typeof o.text === 'string' && o.text.trim())
    .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect === true }));
  if (opts.length !== 4) return null;
  const correct = opts.filter((o) => o.isCorrect);
  if (correct.length !== 1) return null;
  if (new Set(opts.map((o) => o.text.toLowerCase())).size !== 4) return null;
  const answer = typeof raw.answer === 'string' ? raw.answer.trim() : '';
  if (answer !== correct[0].text) return null;
  const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(raw.difficulty) ? raw.difficulty : 'MEDIUM';
  return {
    grade: group.grade,
    subject: group.subject,
    chapter: group.chapter,
    concept: group.concept,
    type: 'MCQ',
    text,
    answer,
    marks: 1,
    difficulty,
    explanation: typeof raw.explanation === 'string' ? raw.explanation.trim().slice(0, 400) : undefined,
    options: opts,
  };
}

async function main() {
  const chapters = await prisma.chapter.findMany({
    where: { grade: { in: GRADES } },
    select: {
      id: true,
      name: true,
      grade: true,
      subject: { select: { name: true } },
      topics: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          order: true,
          concepts: {
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
          },
        },
      },
    },
    orderBy: [{ subject: { name: 'asc' } }, { order: 'asc' }],
  });

  const counts = await prisma.question.groupBy({ by: ['conceptId'], _count: { _all: true } });
  const countByConcept = new Map(counts.map((c) => [c.conceptId, c._count._all]));
  const existing = await prisma.question.findMany({
    where: { conceptId: { not: null } },
    select: { conceptId: true, text: true },
  });
  const textsByConcept = new Map();
  for (const q of existing) {
    if (!q.conceptId) continue;
    if (!textsByConcept.has(q.conceptId)) textsByConcept.set(q.conceptId, []);
    textsByConcept.get(q.conceptId).push(q.text);
  }

  const groups = [];
  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      for (const concept of topic.concepts) {
        const have = countByConcept.get(concept.id) ?? 0;
        if (have >= TARGET) continue;
        groups.push({
          grade: chapter.grade,
          subject: chapter.subject.name,
          chapter: chapter.name,
          topic: topic.name,
          concept: concept.name,
          existing: textsByConcept.get(concept.id) ?? [],
          wanted: Math.min(TARGET - have, 3),
        });
      }
    }
  }

  console.log(`concepts below target (${TARGET}): ${groups.length} in grades ${GRADES.join(',')}`);
  if (DRY) {
    for (const g of groups.slice(0, 15)) console.log(`  - ${g.grade} ${g.subject} / ${g.chapter} / ${g.concept} (have ${g.existing.length}, want ${g.wanted})`);
    await prisma.$disconnect();
    return;
  }
  if (!groups.length) {
    await prisma.$disconnect();
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let calls = 0;
  let written = 0;
  let dropped = 0;
  const questions = [];
  const failures = [];

  for (let i = 0; i < groups.length && calls < MAX_CALLS; i += BATCH) {
    const batch = groups.slice(i, i + BATCH);
    const prompt = batch
      .map((g, index) => `### Question group ${index + 1}\n${userPrompt(g)}`)
      .join('\n\n')
      .concat(
        `\n\nReturn one JSON object: {"questions":[...]} containing every question for every group above, in group order. Each question keeps the "concept" field of its own group.`,
      );

    let text = '';
    try {
      text = await callModel(SYSTEM, prompt);
      calls += 1;
    } catch (err) {
      failures.push(`${batch.map((b) => b.concept).join(', ')}: ${String(err).slice(0, 120)}`);
      continue;
    }

    const raw = parseQuestions(text);
    const byConcept = new Map(batch.map((g) => [g.concept.toLowerCase(), g]));
    for (const item of raw) {
      const key = String(item?.concept ?? '').trim().toLowerCase();
      const group = byConcept.get(key);
      if (!group) {
        dropped += 1;
        continue;
      }
      const cleaned = cleanQuestion(item, group);
      if (!cleaned) {
        dropped += 1;
        continue;
      }
      if (group.existing.some((t) => t.trim().toLowerCase() === cleaned.text.toLowerCase())) {
        dropped += 1;
        continue;
      }
      questions.push(cleaned);
      written += 1;
      group.existing.push(cleaned.text);
    }

    const outFile = path.join(OUT_DIR, `questions-gen-${GRADES.join('')}-${String(calls).padStart(3, '0')}.json`);
    if (questions.length) fs.writeFileSync(outFile, JSON.stringify({ questions }, null, 2));
    process.stdout.write(`\r  calls ${calls} · questions ${written} · dropped ${dropped} · groups ${Math.min(i + BATCH, groups.length)}/${groups.length}   `);
  }

  // One consolidated fragment per run keeps the merge step to a single file.
  for (const file of fs.readdirSync(OUT_DIR)) {
    if (file.startsWith(`questions-gen-${GRADES.join('')}-`)) fs.rmSync(path.join(OUT_DIR, file));
  }
  const outFile = path.join(OUT_DIR, `questions-gen-grade-${GRADES.join('-')}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ questions: dedupe(questions) }, null, 2));

  console.log(`\n  wrote ${outFile}: ${dedupe(questions).length} questions from ${calls} calls`);
  if (failures.length) {
    console.log(`  ${failures.length} calls failed:`);
    for (const failure of failures.slice(0, 5)) console.log(`   - ${failure}`);
  }
  await prisma.$disconnect();
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((q) => {
    const key = q.text.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
