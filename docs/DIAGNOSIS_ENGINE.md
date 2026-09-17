# SANRO AI — Diagnosis Engine

## 1. Principle

Diagnosis derives **evidence**, not a percentage.

For every concept covered by a student's attempts:

```
concept score = (questions correct ÷ questions attempted) on that concept
evidence = questions attempted count
```

Classification:

| Condition | Verdict |
|---|---|
| correct% ≥ 75 and evidence ≥ threshold | STRONG |
| 50% ≤ correct% < 75 and evidence ≥ threshold | DEVELOPING |
| correct% < 50 and evidence ≥ threshold | WEAK |
| evidence < threshold | INSUFFICIENT_EVIDENCE |

Thresholds: per-concept evidence count (e.g. ≥ 4 questions for a verdict) and
mastery floor (e.g. 80% to call MASTERED). Configurable constants, never
hardcoded IDs.

## 2. Rules

- A single weak answer never diagnoses a concept as WEAK.
- NEVER claim MASTERED without evidence.
- Aggregations are per student+concept across assessments.

## 3. Misconception Detection

Where evidence is sufficient, surface **possible** misconception patterns
(sign error, formula confusion, conceptual misunderstanding, calculation error,
terminology confusion) phrased as "Possible misconception" — never as a claim
about the student's mental state.

## 4. APIs

- `GET /diagnosis/my-mastery` (student)
- `GET /diagnosis/student-mastery/:studentId` (teacher/admin)
- ConceptMastery rows updated after each evaluated attempt.

## 5. Outputs

Mastery data feeds:
- Student Home focus ("Fix This")
- Concept page mastery badge
- Teacher/class analytics
- Parent view (weak areas + improvement)
- Remediation plan generation