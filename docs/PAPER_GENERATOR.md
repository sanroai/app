# SANRO AI — Paper Generator

## 1. Capabilities

Teacher/Admin can generate:

- full-length paper
- chapter test
- concept test
- 30-minute quiz
- custom assessment

Filters: board, grade, subject, chapter, topic, concept, difficulty, question
type, marks, duration.

## 2. Workflow

Generate (AI-assisted or from bank) → preview → edit/reorder → regenerate
individual question → answer key → PDF → print → save → create assessment
(`?paper=` prefills assessment form with `sourcePaperId`).

## 3. Data Integrity

Papers snapshot question versions at generation; historical papers show their
snapshots. Version A/B supported.

## 4. PDF (real selectable text)

- A4, header, institution, title, instructions, questions, options, sections,
  answer key, results where applicable.
- No blank first page; question blocks kept together where practical.
- Handles short/long papers, mixed sections, page breaks, long question text,
  images, answer key, mobile download.
- `Content-Type: application/pdf`; never screenshot-as-PDF.

## 5. APIs

- `GET/POST /papers`, `GET /papers/:id`
- `POST /papers/:id/duplicate|regenerate`
- `GET /papers/:id/pdf`
- Web proxy: `/proxy/preview/:id?token&kind=STUDENT|ANSWER_KEY` (server-side,
  Bearer injected).