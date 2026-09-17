# SANRO AI — Demo Data

## 1. Demo Institution

**Sanro Demo School**

| Account | Role | Location |
|---|---|---|
| admin@sanroai.com | SUPER_ADMIN | platform-wide, no institution |
| principal@sanroai.com | INSTITUTION_ADMIN | Sanro Demo School |
| teacher@sanroai.com | TEACHER | Sanro Demo School |
| student@sanroai.com | STUDENT | Sanro Demo School, Class 10 |
| parent@sanroai.com | PARENT | linked to student |

Password (all): `Sanro@123`. Bcrypt-hashed; seeded idempotently (no duplicate
users).

Relationships are real: student has actual grade/class assignment; parent is
linked to that student.

## 2. Curriculum Seed

- CBSE board, grades 1–10, Science + Mathematics
- ~28 chapters (Class 10: 13 Science + 15 Math; Class 9: 4+4; Class 8: 3+3;
  Classes 1–7: 2–3 each), topics, concepts
- 135+ content items incl. 70 YouTube embeds (Classes 8–10), study notes, quick
  revision
- 45+ question bank items across concepts

## 3. Gamification Seed

420 XP · 7-day streak · 6 achievements · 7 concept mastery rows.

## 4. AR Demo

8 GLB demo models (cube, cuboid, cone, cylinder, prism, pyramid, sphere, atom)
with validated metadata + preview SVGs.

## 5. Rules

Demo data exists ONLY via explicit seed. Never fake production statistics,
mastery, questions, assessments, or AI responses. Seed is re-runnable
(idempotent) — no duplicates on re-seed.