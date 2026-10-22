import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, login, makePrisma, startTestApp } from './helpers';

/**
 * The practice loop is the heart of the product (ASSESS -> DIAGNOSE -> FIX -> RETEST).
 *
 * It used to crash on submit: the practice id was written into
 * `DiagnosticResult.attemptId`, which points at an assessment attempt, so every
 * submit failed with a foreign-key error and the student saw a 500. This suite
 * locks the whole flow down: start -> answer -> submit -> mastery + XP.
 *
 * It also locks the rules that were wrong:
 *  - the completion bonus is only paid when the student actually answered
 *    something (otherwise a set could be started and submitted over and over to
 *    farm XP),
 *  - an activity with 0 XP is still an activity (the streak moves),
 *  - only graded, ANSWERED questions count for the score and the mastery
 *    evidence - a written answer is neither right nor wrong.
 */
describe('Practice flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let studentId: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    const res = await login(app, 'student@sanroai.com', process.env.QA_PASSWORD ?? process.env.SEED_DEMO_PASSWORD ?? '');
    token = res.body.accessToken;
    const student = await prisma.student.findFirst({ where: { user: { email: 'student@sanroai.com' } } });
    studentId = student!.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  /** A concept that has both auto-graded and written questions. */
  const mixedConceptId = async (): Promise<string> => {
    const rows = await prisma.question.findMany({
      where: { status: 'APPROVED', conceptId: { not: null } },
      select: { conceptId: true, type: true },
    });
    const byConcept = new Map<string, string[]>();
    for (const r of rows) {
      const list = byConcept.get(r.conceptId!) ?? [];
      list.push(r.type);
      byConcept.set(r.conceptId!, list);
    }
    for (const [conceptId, types] of byConcept) {
      const graded = types.filter((t) => ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'FILL_BLANK'].includes(t)).length;
      if (graded >= 1 && types.length > graded) return conceptId;
    }
    throw new Error('no concept with both graded and written questions');
  };

  it('starts a practice session for a concept', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    expect(path.status).toBe(200);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;
    expect(conceptId).toBeTruthy();

    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
    expect(start.status).toBe(201);
    expect(start.body.practiceId).toBeTruthy();

    const detail = await api(app, 'get', `/learning/practice/${start.body.practiceId}`, token);
    expect(detail.status).toBe(200);
    expect(Array.isArray(detail.body.questions)).toBe(true);
  });

  it('clamps the requested question count to a sane range', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;

    const huge = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 100000 });
    expect(huge.status).toBe(201);
    expect(huge.body.questions.length).toBeLessThanOrEqual(20);

    const zero = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 0 });
    expect(zero.status).toBe(201);
    expect(zero.body.questions.length).toBeGreaterThanOrEqual(1);

    const negative = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: -5 });
    expect(negative.status).toBe(201);
    expect(negative.body.questions.length).toBeGreaterThanOrEqual(1);
  });

  it('submits a practice session without crashing and records the evidence', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;

    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
    expect(start.status).toBe(201);
    const practiceId = start.body.practiceId as string;

    const detail = await api(app, 'get', `/learning/practice/${practiceId}`, token);
    const questions = detail.body.questions as Array<{ id: string; options?: Array<{ id: string; text: string }> }>;
    let answeredCount = 0;
    let correctCount = 0;
    for (const q of questions) {
      // the graded answer is the option TEXT (the API resolves an option id too, but
      // the text is the contract - sending the wrong field name silently stored null)
      const option = q.options?.[0];
      if (!option) continue;
      const answered = await api(app, 'post', `/learning/practice/${practiceId}/answer`, token, {
        questionId: q.id,
        answer: option.text,
      });
      expect(answered.status).toBe(201);
      answeredCount++;
      if (answered.body.correct === true) correctCount++;
    }
    expect(answeredCount).toBeGreaterThan(0);

    const before = await prisma.gamificationProfile.findUnique({ where: { studentId } });
    const beforeXp = before?.xp ?? 0;

    const submit = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
    expect(submit.status).toBe(201);
    expect(submit.body).toHaveProperty('score');
    expect(submit.body).toHaveProperty('masteryUpdate');

    // the practice evidence is linked to the practice set, never to an assessment attempt
    const evidence = await prisma.diagnosticResult.findMany({
      where: { studentId, practiceSetId: practiceId },
    });
    expect(evidence.length).toBeGreaterThan(0);
    for (const row of evidence) {
      expect(row.attemptId).toBeNull();
    }

    // practice earns XP and the XP ledger records it: 5 per correct answer + 10 for
    // finishing (the rule the UI quotes, asserted exactly)
    const expectedXp = correctCount * 5 + 10;
    expect(submit.body.xpEarned).toBe(expectedXp);
    const ledger = await prisma.xpEvent.findFirst({
      where: { studentId, reason: 'PRACTICE_COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(ledger).toBeTruthy();
    expect(ledger!.xp).toBe(expectedXp);

    const after = await prisma.gamificationProfile.findUnique({ where: { studentId } });
    expect(after!.xp).toBe(beforeXp + submit.body.xpEarned);
  });

  it('scores only the graded, answered questions', async () => {
    const conceptId = await mixedConceptId();

    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 20 });
    expect(start.status).toBe(201);
    const practiceId = start.body.practiceId as string;
    const setQuestions = start.body.questions as Array<{ id: string; type: string; options?: Array<{ id: string; text: string }> }>;

    const gradable = setQuestions.filter((q) => ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'FILL_BLANK'].includes(q.type));
    const written = setQuestions.filter((q) => !['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'FILL_BLANK'].includes(q.type));
    expect(gradable.length).toBeGreaterThan(0);
    expect(written.length).toBeGreaterThan(0);

    // Answer only the auto-graded questions, and answer them CORRECTLY.
    let correct = 0;
    for (const q of gradable) {
      const stored = await prisma.question.findUnique({
        where: { id: q.id },
        select: { answer: true, options: { orderBy: { order: 'asc' } } },
      });
      const option = stored?.options.find((o) => o.text === stored.answer) ?? stored?.options[0];
      const answered = await api(app, 'post', `/learning/practice/${practiceId}/answer`, token, {
        questionId: q.id,
        answer: option!.text,
      });
      expect(answered.status).toBe(201);
      expect(answered.body.correct).toBe(true);
      correct++;
    }

    const submit = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
    expect(submit.status).toBe(201);

    // the set size is still reported
    expect(submit.body.totalQuestions).toBe(setQuestions.length);
    // the denominator is the graded, answered questions - the written ones are
    // neither right nor wrong, so they are out of the score
    expect(submit.body.gradedQuestions).toBe(gradable.length);
    expect(submit.body.correctAnswers).toBe(correct);
    expect(submit.body.score).toBe(100);
    // the written answers were not given, so none of them awaits review
    expect(submit.body.pendingGrading).toBe(0);
    expect(submit.body.answeredQuestions).toBe(gradable.length);
    // 5 XP per correct answer + the 10 XP completion bonus
    expect(submit.body.xpEarned).toBe(correct * 5 + 10);

    // the mastery evidence counts the graded questions only
    const evidence = await prisma.diagnosticResult.findMany({
      where: { studentId, practiceSetId: practiceId },
    });
    expect(evidence.length).toBeGreaterThan(0);
    for (const row of evidence) {
      expect(row.attempts).toBe(gradable.length);
      expect(row.correct).toBe(correct);
    }
  });

  it('does not pay the completion bonus for a practice that was never answered', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;

    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
    expect(start.status).toBe(201);
    const practiceId = start.body.practiceId as string;

    const before = await prisma.gamificationProfile.findUnique({ where: { studentId } });
    const beforeXp = before?.xp ?? 0;
    const ledgerBefore = await prisma.xpEvent.count({ where: { studentId } });

    const submit = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
    expect(submit.status).toBe(201);
    // no XP at all: the set was never answered
    expect(submit.body.xpEarned).toBe(0);
    expect(submit.body.correctAnswers).toBe(0);
    expect(submit.body.gradedQuestions).toBe(0);
    expect(submit.body.answeredQuestions).toBe(0);

    const after = await prisma.gamificationProfile.findUnique({ where: { studentId } });
    expect(after!.xp).toBe(beforeXp);
    expect(await prisma.xpEvent.count({ where: { studentId } })).toBe(ledgerBefore);
  });

  it('counts a 0 XP activity as activity (the streak moves)', async () => {
    const profile = await prisma.gamificationProfile.findUnique({ where: { studentId } });
    const original = { lastActiveAt: profile!.lastActiveAt, streakDays: profile!.streakDays };

    // "yesterday" -> the next activity extends the streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    await prisma.gamificationProfile.update({
      where: { studentId },
      data: { lastActiveAt: yesterday, streakDays: 4 },
    });

    try {
      const path = await api(app, 'get', '/learning/path', token);
      const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;
      const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
      const practiceId = start.body.practiceId as string;

      const submit = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
      expect(submit.status).toBe(201);
      expect(submit.body.xpEarned).toBe(0);

      const after = await prisma.gamificationProfile.findUnique({ where: { studentId } });
      expect(after!.streakDays).toBe(5);
      expect(after!.lastActiveAt!.getTime()).toBeGreaterThan(yesterday.getTime());
    } finally {
      await prisma.gamificationProfile.update({
        where: { studentId },
        data: { lastActiveAt: original.lastActiveAt, streakDays: original.streakDays },
      });
    }
  });

  it('refuses to submit the same practice session twice', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;
    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
    const practiceId = start.body.practiceId as string;

    const first = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
    expect(first.status).toBe(201);

    const second = await api(app, 'post', `/learning/practice/${practiceId}/submit`, token, {});
    expect(second.status).toBe(409);
  });

  it('grades the option text, and tolerates a client that sends the option id', async () => {
    const path = await api(app, 'get', '/learning/path', token);
    const conceptId = path.body.next?.conceptId ?? path.body.track?.[0]?.conceptId;
    const start = await api(app, 'post', '/learning/practice/start', token, { conceptId, questionCount: 5 });
    const practiceId = start.body.practiceId as string;

    const detail = await api(app, 'get', `/learning/practice/${practiceId}`, token);
    const questions = detail.body.questions as Array<{ id: string; options?: Array<{ id: string; text: string }> }>;
    const question = questions.find((q) => (q.options?.length ?? 0) > 0);
    expect(question).toBeTruthy();

    // the correct option, straight from the question bank
    const stored = await prisma.question.findUnique({
      where: { id: question!.id },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    const correctOption = stored?.options.find((o) => o.text === stored.answer) ?? stored?.options[0];
    expect(correctOption).toBeTruthy();

    // 1) the documented contract: the option TEXT
    const byText = await api(app, 'post', `/learning/practice/${practiceId}/answer`, token, {
      questionId: question!.id,
      answer: correctOption!.text,
    });
    expect(byText.status).toBe(201);
    expect(byText.body.correct).toBe(true);

    // 2) a client that sends the option ID must not be marked wrong
    const byId = await api(app, 'post', `/learning/practice/${practiceId}/answer`, token, {
      questionId: question!.id,
      answer: correctOption!.id,
    });
    expect(byId.status).toBe(201);
    expect(byId.body.correct).toBe(true);

    const saved = await prisma.practiceAnswer.findFirst({
      where: { practiceSetId: practiceId, questionId: question!.id },
    });
    expect(saved?.answer).toBe(correctOption!.text);
    expect(saved?.isCorrect).toBe(true);
  });
});
