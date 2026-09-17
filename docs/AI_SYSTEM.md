# SANRO AI — AI System

## 1. Provider Abstraction

`AIProvider` interface with providers: `mock` (default, deterministic dev
fallback), `openai`, `gemini`. Model configurable (`AI_MODEL`, default
`gpt-4o-mini`). Keys live server-side only.

## 2. Operations

- `generateQuestion(params)` — single question draft
- `generateQuestionSet(params)` — batch (paper generation)
- `answerChat(message, context)` — Ask SANRO
- `generateExplanation(topic)` — concept explanation
- content generation: flashcards/notes from approved KB chunks

## 3. Ask SANRO (context-aware)

- Knows current board / grade / subject / chapter / topic / concept.
- Grounds answers in approved curriculum knowledge (retrieval from approved
  KB chunks/approved content).
- Must NOT expose other students' data, private institution data, teacher-only
  info, parent/private info. No hallucinated curriculum facts.
- Handles: timeout, malformed JSON, partial responses; safe retry.

## 4. AI Question Generation Safety

Draft only → validation (answer correctness, mapping, difficulty, duplicates,
ambiguity, unsupported claims) → human review → approval → publish.
Never auto-publish AI educational material.

## 5. Endpoints

- `POST /chat/ask-sanro` (STUDENT)
- `POST /ai/explain`, `POST /ai/analyze-homework` (STUDENT, PARENT via
  ParentContentGuard with content restriction)
- `POST /questions/generate`, `POST /knowledge-base/:id/generate-*`
- `POST /papers` uses AI question set generation

## 6. Reliability

Rate limits, per-request timeouts, structured output parsing with fallback,
usage only via approved sources, no credential exposure, audit of generated
content provenance.