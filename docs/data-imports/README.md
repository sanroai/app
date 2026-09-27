# SANRO AI — Data Import Records

## Purpose

Traceability and auditability for every curriculum/content data import
performed against SANRO (bulk student import, content bulk upload, question
bank imports, curriculum seeds delivered as files, AR asset imports).

Every import gets a record. Records answer: what was imported, from where,
when, how it was mapped and validated, what was rejected, who reviewed it, and
whether it is published.

Rules:

- **Never overwrite previous import history.** Records are append-only. If an
  import is corrected or redone, add a new record and link it from the
  previous one (`Supersedes` / `Superseded by` row); do not edit the original
  outcome in place.
- One file per import, plus a summary line in the index table below.
- No secrets in records: no credentials, connection strings, API keys, or
  tokens. Reference file paths and document names only.

## Naming convention

```
docs/data-imports/YYYY-MM-DD-<slug>.md
```

- `YYYY-MM-DD` — date the import was committed (file date must match the
  record's Date field).
- `<slug>` — short lowercase kebab-case descriptor, e.g.
  `2026-10-05-cbse-class10-science-chapters.md`.
- Keep the slug stable and unique; if an import is re-run, use a new date.

## Required record fields

| Field | Description |
|---|---|
| Source file | Original file name and path (e.g. `imports/2026/cbse-class10-science.xlsx`), plus origin (vendor, CBSE publication, in-house sheet) |
| Date | Import commit date (YYYY-MM-DD) |
| Board | e.g. CBSE |
| Class | e.g. Class 10 |
| Subject | e.g. Science / Mathematics |
| Record count | Rows read → created / updated / skipped / failed |
| Mapping | Column-to-field mapping applied, incl. any enum conversions (e.g. UI `SHORT` → Prisma `SHORT_ANSWER`) |
| Validation result | Pass/fail, validator used, schema/version validated against |
| Duplicates | Detected count and how they were handled (skip / update / reject) |
| Errors | Failed rows with reasons; row numbers where available |
| Reviewer | Who reviewed and approved the import |
| Publication status | Draft / Reviewed / Published (and whether content is live to students) |

## Table template (copy per import into the per-import file)

```markdown
# Data import — <Board> <Class> <Subject>

| Field | Detail |
|---|---|
| Source file | |
| Date | |
| Board | |
| Class | |
| Subject | |
| Record count | read: 0 — created: 0, updated: 0, skipped: 0, failed: 0 |
| Mapping | |
| Validation result | |
| Duplicates | |
| Errors | |
| Reviewer | |
| Publication status | Draft |
| Supersedes | none |
| Superseded by | none |
```

## Import index

Append one row per committed import. Never delete a row.

| Date | File | Board | Class | Subject | Records | Reviewer | Status |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

## Status

No imports have been performed yet. Post-reset (2026-09-26), the local
database is a clean slate and this directory contains no per-import records.

Related: `docs/IMPORTS.md` (bulk import flows and APIs),
`docs/DATA_INGESTION.md`, `docs/CHANGELOG_DEVELOPMENT.md`.
