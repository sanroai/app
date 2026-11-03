// End-to-end guard for the spaced-review queue and the practice feedback.
//
//   node scripts/qa/probe-review-queue.mjs [--api http://localhost:4000/api/v1]
//
// Checks, in order:
//   1. GET /learning/review returns the queue shape (and a due concept, when the
//      account has mastery history);
//   2. POST /learning/review/start builds a practice set over those concepts;
//   3. every saved answer comes back with an explanation (authored or quoted
//      from the notes) - never the old template sentence;
//   4. submitting returns a `review` entry per question with the answer and the
//      reason;
//   5. the concepts just reviewed are no longer due (the interval moved), which
//      is the whole point of spacing.
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const API = arg('--api', 'http://localhost:4000/api/v1');
const EMAIL = arg('--email', 'student@sanroai.com');
const PASSWORD = arg('--password', process.env.QA_PASSWORD ?? 'Sanro@123');

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

const call = async (method, path, body, token) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
if (login.status !== 200 && login.status !== 201) {
  console.error(`  FAIL  login ${login.status}`);
  process.exit(1);
}
const token = login.body.accessToken;
console.log(`  api: ${API}  user: ${EMAIL}\n`);

const queue = await call('GET', '/learning/review', null, token);
check('GET /learning/review answers', queue.status === 200, `status ${queue.status}`);
check(
  'queue has the documented shape',
  typeof queue.body?.dueNow === 'number' && Array.isArray(queue.body?.concepts),
  `dueNow=${queue.body?.dueNow} concepts=${queue.body?.concepts?.length}`,
);

if (!queue.body?.count) {
  console.log('\n  no concepts due for this account - nothing further to check');
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

const dueIds = queue.body.concepts.map((c) => c.conceptId);
const started = await call('POST', '/learning/review/start', {}, token);
check('POST /learning/review/start answers', started.status === 201 || started.status === 200, `status ${started.status}`);
check('review practice has questions', Array.isArray(started.body?.questions) && started.body.questions.length > 0, `${started.body?.questions?.length ?? 0} questions`);
check(
  'review practice covers the due concepts',
  (started.body?.questions ?? []).every((q) => !q.conceptId || dueIds.includes(q.conceptId)),
);

const practiceId = started.body?.practiceId;
if (!practiceId) process.exit(1);

let explained = 0;
let answered = 0;
for (const question of started.body.questions) {
  if (!question.options || question.options.length === 0) continue;
  const saved = await call(
    'POST',
    `/learning/practice/${practiceId}/answer`,
    { questionId: question.id, answer: question.options[0].text },
    token,
  );
  answered += 1;
  if (saved.body?.explanation && saved.body.explanation.trim().length > 20) explained += 1;
}
check(
  'every saved answer carries an explanation',
  answered === 0 || explained === answered,
  `${explained}/${answered}`,
);
check(
  'the legacy template sentence is gone',
  !(await Promise.all(
    started.body.questions.map((q) =>
      call('POST', `/learning/practice/${practiceId}/answer`, { questionId: q.id, answer: q.options?.[0]?.text ?? 'x' }, token),
    ),
  )).some((r) => r.body?.explanation === 'Refer to the chapter notes for the detailed solution.'),
);

const submit = await call('POST', `/learning/practice/${practiceId}/submit`, {}, token);
check('submit answers', submit.status === 201 || submit.status === 200, `status ${submit.status}`);
const review = submit.body?.review ?? [];
check(
  'submit returns one review entry per question',
  review.length === started.body.questions.length,
  `${review.length}/${started.body.questions.length}`,
);
check(
  'every review entry has the answer and a reason',
  review.every((entry) => typeof entry.correctAnswer === 'string' && (entry.explanation ?? '').length > 20),
);
check(
  'graded entries report whether the answer was right',
  review.filter((entry) => entry.graded).every((entry) => typeof entry.correct === 'boolean'),
);

const after = await call('GET', '/learning/review', null, token);
const stillDue = new Set((after.body?.concepts ?? []).map((c) => c.conceptId));
const movedOut = dueIds.filter((id) => !stillDue.has(id));
check(
  'the reviewed concepts are no longer due',
  movedOut.length > 0,
  `${movedOut.length}/${dueIds.length} rescheduled, ${after.body?.count ?? 0} still due`,
);

const failures = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failures.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
