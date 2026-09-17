# SANRO AI — Data Ingestion

## 1. Source Pipeline

Educational books/PDFs are SOURCE MATERIAL, not final content.

```
PDF → extract text → OCR if needed → detect chapters → detect topics →
detect concepts → map curriculum → normalize chunks → store source references →
embeddings → knowledge base → notes/revision generation → question generation →
human review → publish
```

Traceability retained: book, page, chapter, topic, concept, source reference.

## 2. Failure Handling

Handle scanned PDFs, OCR failures, corrupt PDFs, password-protected PDFs, huge
PDFs, duplicate PDFs, wrong mappings, partial ingestion, failed jobs, retries.
Each maps to a distinct status/error on the ProcessingJob.

## 3. Content Import API

- `POST /content-import/upload` (50 MB, MIME validated: PDF/NOTES; video via
  YouTube URL)
- `GET /content-import/status/:id` (PROCESSING/COMPLETED/FAILED)
- `POST /content-import/retry/:id` (re-queue, max retries)

## 4. YouTube

Store URL/videoId/title/thumbnail/duration/source/curriculum mapping. Handle
deleted, private, region-restricted, unembeddable, duplicate, wrong mapping.
Uses `youtube-transcript` for transcript extraction where allowed.

## 5. Knowledge Base

- KnowledgeBase + KnowledgeBaseChunk records
- Chunking + optional embeddings for retrieval
- ContentGenerator produces flashcards/notes/questions from approved chunks
- AI-generated material is DRAFT until human approval
- Job queue must be durable (rebuild replaces in-memory queue with a
  persistent queue) so restart/failure never loses jobs.

## 6. Bulk Uploads

PDF / CSV / XLSX / ZIP (where appropriate) / YouTube URLs. Large files never
loaded entirely into browser memory (server-side chunked handling).