# SANRO AI — Learning Architecture

## 1. Path A: The Traditional Library

Hierarchy: Class → Subject → Chapter → Topic → Concept.

Intended experience: a premium academic library. Self-directed. A student who
only wants to study is never forced through remediation.

## 2. Learn Journeys

- Browse: Home → Learn → Class → Subject → Chapter → Topic → Concept
- Continue learning (resume last concept)
- Search across curriculum + content (role/tenant/publication filtered)
- Bookmark/save concepts
- Concept page modalities:
  - Learn (video + notes + quick revision)
  - Practice (backend-driven quiz w/ mastery tracking)
  - Quick Quiz (5 concept questions from DB)
  - Flashcards (real questions, Again/Hard/Good/Easy)
  - Challenge (timed 60s / 10 Qs / 50 XP max)
  - AR/3D (where assets mapped)
  - Ask SANRO (context-aware AI)

## 3. API Surfacing

- `/learning/home` — student dashboard data (focus, continue, pending)
- `/learning/chapters` (+/:id) — chapter tree with concepts
- `/learning/concepts/:id` — concept detail (content, mastery, practice data)
- `/learning/complete-task`, `/learning/practice/start|answer|submit`
- Gamification: `/learning/gamification/profile|leaderboard|achievements`

## 4. Student Grade Filtering

Learning content is filtered by the student's grade/class assignment. A grade
with no published content renders a proper empty state (no 0/0 lessons).

## 5. Practice

Entered from Learn, Concept, Assessment result, Fix This, Remediation.
Backend-driven questions only. Track attempt, correctness, concept, difficulty,
evidence. No hardcoded questions anywhere in the student experience.