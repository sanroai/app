# SANRO AI — Assessment Engine

## 1. Purpose

Assessment is not about marks alone — it produces evidence for diagnosis.
Support types: quizzes, chapter tests, concept tests, class tests, practice
assessments, full papers, timed tests.

## 2. Lifecycle

DRAFT → PUBLISHED → AVAILABLE → STARTED → SUBMITTED → EVALUATED → REVIEWED.

## 3. Robustness

Support at minimum:

- timeout (expire + auto-submit policy)
- autosave / drafts (mobile: AsyncStorage draft + 15 s autosave)
- resume after interruption
- network loss (offline queue, clear sync state)
- duplicate submission (server rejects second submit)
- accidental refresh
- app termination
- expired assessment
- late submission / incomplete attempt

## 4. Attempt Integrity

- Assessment snapshots its questions at publish time.
- Attempt + Answer rows are immutable historical records.
- Editing/deleting a question later never changes past attempts.
- Historical attempts remain visible with their snapshot content.

## 5. Auto-Grading

- Objective: direct compare against snapshot answer.
- Subjective (short/long): structured rubric / manual review path with
  EVALUATED → REVIEWED states; mastery service supports both.

## 6. Student Flow

Assess → Submit → Results (score + per-question review) → Diagnosis.
Teacher flow: create → publish → assign (groups/students) → monitor attempts →
see results → diagnose → recommend fix → retest → see improvement.