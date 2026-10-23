// End-to-end check that a seeded chapter can actually be practised and scored:
// start a session as the demo student, answer every auto-graded question with the
// option that the database marks correct, submit, and compare the server's score
// with the number of auto-graded questions.
//
//   node scripts/qa/probe-practice-scoring.mjs [sanro_dev]
//
// Only chapters of the student's own grade are exercised (the API answers 403 for
// any other grade - that is intended, and reported as SKIP here).
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const db = process.argv[2] ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;
const API = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const email = (() => {
  const i = process.argv.indexOf('--email');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : 'student@sanroai.com';
})();

const env = fs.readFileSync('apps/api/.env', 'utf8');
const password = (/^SEED_DEMO_PASSWORD=(.*)$/m.exec(env)?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
if (!password) throw new Error('SEED_DEMO_PASSWORD is missing from apps/api/.env');

const call = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, json, text };
};

const login = await call('/auth/login', { method: 'POST', body: { email, password } });
if (login.status !== 200) throw new Error(`login failed: ${login.status} ${login.text.slice(0, 200)}`);
const token = login.json.accessToken ?? login.json.access_token ?? login.json.token;

const prisma = new PrismaClient();
let failures = 0;
try {
  const student = await prisma.student.findFirst({ where: { user: { email } }, select: { grade: true } });
  const grade = student?.grade ?? '10';

  // chapters of this grade that have questions, newest questions first - the
  // freshly authored ones should be the ones under test
  const chapters = await prisma.chapter.findMany({
    where: { grade, topics: { some: { concepts: { some: { questions: { some: {} } } } } } },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });
  const ranked = [];
  for (const ch of chapters) {
    const newest = await prisma.question.findFirst({
      where: { concept: { topic: { chapterId: ch.id } } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    ranked.push({ ...ch, newest: newest?.createdAt ?? new Date(0) });
  }
  ranked.sort((a, b) => b.newest - a.newest);
  const underTest = ranked.slice(0, 3);

  console.log(`  student grade: ${grade} | chapters with questions: ${chapters.length} | testing ${underTest.length}`);
  for (const chapter of underTest) {
    const start = await call('/learning/practice/start', { method: 'POST', token, body: { chapterId: chapter.id } });
    if (start.status === 403) {
      console.log(`  SKIP ${chapter.code} ${chapter.name}: grade-scoped (403)`);
      continue;
    }
    if (start.status !== 201 && start.status !== 200) {
      console.log(`  FAIL ${chapter.code} ${chapter.name}: start answered ${start.status} ${start.text.slice(0, 160)}`);
      failures += 1;
      continue;
    }
    const practiceId = start.json.practiceId ?? start.json.id;
    const state = await call(`/learning/practice/${practiceId}`, { token });
    const questions = state.json.questions ?? [];
    if (!questions.length) {
      console.log(`  FAIL ${chapter.code}: the session has no questions`);
      failures += 1;
      continue;
    }

    let graded = 0;
    for (const q of questions) {
      const correct = await prisma.questionOption.findFirst({
        where: { questionId: q.id, isCorrect: true },
        select: { text: true },
      });
      if (!correct) continue; // a written answer - not auto-graded
      graded += 1;
      const saved = await call(`/learning/practice/${practiceId}/answer`, {
        method: 'POST',
        token,
        body: { questionId: q.id, answer: correct.text },
      });
      if (saved.status >= 300) {
        console.log(`  FAIL ${chapter.code}: saving an answer answered ${saved.status} ${saved.text.slice(0, 140)}`);
        failures += 1;
      }
    }

    const submit = await call(`/learning/practice/${practiceId}/submit`, { method: 'POST', token });
    if (submit.status >= 300) {
      console.log(`  FAIL ${chapter.code}: submit answered ${submit.status} ${submit.text.slice(0, 160)}`);
      failures += 1;
      continue;
    }
    const score = submit.json.score ?? 0;
    const total = submit.json.totalQuestions ?? questions.length;
    // `score` is a percentage of the auto-graded questions (written answers are
    // neither right nor wrong), so an all-correct session must be exactly 100
    // and a session with nothing auto-graded must be 0.
    const ok = graded > 0 ? score === 100 : score === 0;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'} ${chapter.code} ${chapter.name}: ${questions.length} questions, ` +
      `${graded} auto-graded and all answered correctly, server score ${score}/100 (${total} asked)`,
    );
  }
} finally {
  await prisma.$disconnect();
}

console.log(failures ? `  === PRACTICE SCORING: FAIL (${failures}) ===` : '  === PRACTICE SCORING: PASS ===');
process.exit(failures ? 1 : 0);
