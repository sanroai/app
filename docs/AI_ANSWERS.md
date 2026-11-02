# Sanro AI — answer order, speed, and why it cannot dead-end

The tutor used to be one thing: a Gemini call. That made it slow (3-6 s warm, up
to 45 s before the abort), quota-bound (the free tier allows ~20 text requests a
day) and fragile — once the quota was gone, chat failed and the apps showed
*"Something went wrong"*.

It is now a **ladder**, cheapest answer first.

## The ladder

| # | Step | Network? | Typical |
|---|---|---|---|
| 1 | A pre-written answer for a **suggested chip** | no | < 1 ms |
| 2 | The open **concept/chapter's own notes** | no | < 1 ms |
| 3 | The student's own **mastery rows** ("what am I weak in?") | DB only | ~5 ms |
| 4 | The **reply cache** (same question, same context, same process) | no | < 1 ms |
| 5 | **The model**, for everything the book cannot answer | yes | 3-6 s |

The API still spends ~270-350 ms per request at steps 1-3, and that is all
network + JWT + one or two Prisma queries; the model is not involved.

**The book comes first, the wider world second.** That ordering is enforced in two
places:

- `buildGroundedAnswer` only fires when the question actually names the open
  concept/chapter (or says "this concept"). A student reading *Life Processes* who
  asks about the **reactivity series** gets the model, not a mismatched excerpt —
  that exact case is a unit test.
- The model's system prompt says: answer from the lesson notes in the context
  first; only when they do not cover it, answer from general curriculum knowledge
  and say so.

## Step 1 — the suggested chips

The apps show fixed prompts. Asking them by name means they can be answered
without a model: instant, free, identical every time.

| Where | Chips |
|---|---|
| Mobile **Ask** tab | reactivity series, methane, balancing equations, 5 acids/bases questions, Ohm's law, life processes, improve my score |
| Mobile **concept Ask** | "Explain `<concept>` in simple terms", "practice problems on `<concept>`", "key formulas for `<concept>`" — these go through step 2 |
| Web **/app/chat** | "Explain this concept", "Give me a practice problem", "What am I weak in?", "How do I improve my score?" |

`SUGGESTED_ANSWERS` in `apps/api/src/ai/grounded-answer.ts` holds them. A spec
asserts every chip has an answer and that each one starts with a **bold title**
and ends with a **Takeaway**.

**Adding a chip means adding its answer to that map** — otherwise it falls through
to the model and costs a request.

## Step 2 — the book

`buildGroundedAnswer(message, ctx)` recognises four intents and answers from
`ctx.notes` (the concept's `ContentItem.description`) or the chapter data:

| Intent | Answer |
|---|---|
| formula / equation | the lines of the notes that contain `=`, as a bullet list |
| practice / questions / test me | the chapter's concepts + how practice works (5 XP per correct, +10 for finishing) — it never invents questions |
| summarise / overview | the chapter description, then the concept list, then an excerpt of the notes |
| explain / define / what is | an excerpt of the notes, cut at a sentence boundary (~1,400 chars) |

It returns `null` when the question is not about the open material, which is what
sends it to the model instead of recycling the wrong notes.

## Step 3 — the student's own data

"What am I weak in?" reads `ConceptMastery` for the caller (levels `WEAK` and
`NEEDS_INTERVENTION`, lowest score first) and names the three weakest concepts
with their score and attempt count. A student with no student record (teacher,
parent) falls through untouched.

## Step 5 — the model

Only reached for genuinely outside questions.

| Setting | Before | Now | Why |
|---|---|---|---|
| `maxOutputTokens` (chat) | 4096 | **1600** | 4096 was several screens and the dominant latency cost |
| abort | 45 s | **20 s** | 45 s was long enough for a student to retry, which then tripped the rate limiter |
| 429 retries | 2 (1.5 s / 3 s) | unchanged | a rate limit is not a defect of the model |
| 404 / timeout | next model | unchanged | Google retires model ids without notice |

The system prompt also fixes the **formatting**: a short **bold title**, 2-4 short
sections with **bold labels** or bullets, bold key terms, a one-line
**Takeaway**, plain-text mathematics (never LaTeX).

## When the model fails

`answerChat` never throws. If the model is unavailable or the quota is gone it
falls back to `mockChat`, which answers from whatever curriculum context exists —
the chapter's notes and concept list — and says the AI is busy. The student gets a
useful answer, not an error.

The clients' own error copy is now a **connection** message ("I couldn't reach the
server just now — that is a connection problem, not your question"), because that
is the only failure the API can still produce.

## Guards

```bash
cd apps/api && npx vitest run src/ai/grounded-answer.spec.ts   # 10 tests
node artifacts/qa/2026-11-02/probe-ai-speed.mjs                 # 16 live checks
```

`probe-ai-speed.mjs` asserts: every chip returns `instant: true` under 1.5 s, the
concept explanation and chapter summary are grounded and instant, the weakness
insight names real concepts, an off-topic question is answered by the model
without a 5xx, and the reply is Markdown with a bold title, a Takeaway and no
LaTeX.

## Known limitations

- The reply cache is **per process**. A second Render instance (or a restart)
  starts cold; it only saves the model call, never correctness.
- Grounded answers are as good as the notes. A concept with no `ContentItem`
  description falls to the chapter's concept list, then to the model.
- Chips are matched after normalisation (lower-case, punctuation stripped), so
  "What is Ohm's law?" and "what is ohms law" hit the same entry, but a reworded
  chip will not.
