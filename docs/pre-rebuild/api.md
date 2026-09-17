# SANRO AI — API Reference

## 1. Conventions

- Base URL: `/api/v1` (production: `https://api.sanroai.com/api/v1`)
- Errors: `{ code, message, requestId, statusCode, details? }`
- Payloads returned directly (no envelope).
- Auth: `Authorization: Bearer <jwt>` unless `@Public()`.

## 2. Endpoint Map

| Area | Methods |
|---|---|
| Auth | register-institution, login, refresh, forgot-password, reset-password, change-password |
| Users | me (GET/PATCH), me/avatar, me/notifications/:id/read |
| Institutions | mine (GET/PATCH), mine/stats |
| Academics | academic-years (GET/POST/PATCH/activate), groups (GET/POST/PATCH/assign) |
| People | students CRUD + deactivate/move; teachers; parents |
| Curriculum | boards, grades, subjects, chapters, topics, concepts, tree (GET); grades–concepts (POST, SUPER_ADMIN) |
| Questions | list/detail/create/update/delete, review, generate (AI) |
| Papers | list/create/detail/duplicate/regenerate/pdf |
| Assessments | list/my/detail, publish, assign, attempts, submit |
| Diagnosis | my-mastery, student-mastery/:studentId |
| Remediation | my, plans/:id, items/:id/status, retest |
| Learning | home, chapters, chapter/:id, concepts/:id, complete-task, practice start/answer/submit, gamification (profile/leaderboard/achievements), progress |
| Dashboard | student, teacher, institution, parent, super-admin |
| Admin | institutions CRUD/status/subscription, curriculum overview, users, audit, seed-curriculum |
| Chat | ask-sanro (context-aware) |
| AI | explain, analyze-homework (ParentContentGuard) |
| Imports | upload/preview/commit/history (students), content-import upload/status/retry |
| Knowledge Base | CRUD, process, generate flashcards/notes/questions, jobs/:jobId |
| AR | list/detail CRUD, upload-model, upload-image, validate, activity, my-activity |
| Files | pdfs/:name (public serving) |
| Health | health |

## 3. Auth

- JWT 15 min, refresh token 30 days (server-side, revocable).
- Login returns `{ token, refreshToken, user, memberships }`.
- Forgot password returns only `{ success: true }`.
- Refresh endpoint rotates refresh token (old revoked).

## 4. RBAC Matrix

| Area | Roles |
|---|---|
| People mutations | INSTITUTION_ADMIN |
| Questions/papers/assessments creation | TEACHER, INSTITUTION_ADMIN |
| Assessment submit / learning / diagnosis / remediation / chat | STUDENT |
| Curriculum & content mutations | SUPER_ADMIN (grades–concepts) |
| Admin | SUPER_ADMIN |
| AR admin | INSTITUTION_ADMIN, SUPER_ADMIN |
| Dashboard role endpoints | respective role |

SUPER_ADMIN passes all role guards. Parent locked out of learning-content
flows by `ParentContentGuard`.

## 5. Pagination / Filtering

List endpoints support `page`, `limit`, role/tenant-filtered visibility, and
curriculum filters. Question list supports difficulty/type/concept filters.