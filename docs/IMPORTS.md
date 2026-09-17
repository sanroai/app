# SANRO AI — Imports

## 1. Bulk Student Import

CSV/XLSX flow:

```
Upload → Validate → Preview → Detect duplicates → Confirm → Import → Results
```

Results show: created / updated / skipped / failed, with row-level errors.
Import history retained (ImportBatch/ImportRow).

Validation: required columns (name, email, rollNumber, class, section), email
format, valid grade, duplicate detection, partial failure + retry.
Upload limits: 10 MB xlsx; server parses; never in browser memory.

## 2. Content Bulk Upload

PDF / CSV / XLSX / ZIP (where appropriate) / YouTube URLs.
Status + retry endpoints (`/content-import/status|retry`).
Large-file handling server-side.

## 3. APIs

- Student: `POST /imports/upload|preview|commit`, `GET /imports/history`
- Content: `POST /content-import/upload`, `GET /content-import/status/:id`,
  `POST /content-import/retry/:id`

## 4. Integrity

Imports create real users with default credentials (no fabricated records),
respect tenant scoping, and are fully audited. Duplicate detection prevents
stale re-imports while allowing updates to existing rows.