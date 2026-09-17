# SANRO AI — Remediation Engine

## 1. Principle

When a weakness is detected, build a targeted pathway: **WHAT TO DO NOW.**

Sequencing (per weak concept):

```
Why this matters
→ Recommended lesson
→ Video
→ Notes
→ Worked example
→ Practice (targeted questions)
→ Quick check
→ Retest
```

No generic content dumps.

## 2. Fix This

Every meaningful weakness leads to a contextual **Fix This** card:

"Fix: Combination Reactions"
1. Watch this
2. Read this
3. Try these 5 questions
4. Quick check
5. Retest

Remediation item completion is tracked (student marks steps done).

## 3. Plan Generation

- Trigger: diagnosis marks a concept WEAK (with sufficient evidence) after an
  assessment, or teacher-initiated.
- Plan ties items to real curriculum content and real question-bank questions.
- Plans are per student+concept; retest uses the same concept question pool.

## 4. Retest

- A retest measures the same concept/skill set.
- Compare before vs after: accuracy, mastery evidence, improvement, remaining
  gaps.
- "Mastered" only when evidence supports it.

## 5. Improvement Record

Key output is: "Your understanding improved" — e.g. `Before: 42% → After: 81%`
(+39 points). Improvement records feed student home, parent dashboard, teacher
and principal analytics, and the improvement graph.

## 6. APIs

- `GET /remediation/my` (student plans)
- `GET /remediation/plans/:id`
- `PATCH /remediation/items/:itemId/status`
- `POST /remediation/retest` (create retest assessment)

## 7. Data Integrity

Retest attempts are evaluated like normal attempts and feed the SAME concept
evidence model (before/after comparison is derived from evidence, not stored
CRUD-write of arbitrary percentages).