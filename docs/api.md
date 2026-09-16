# API

Base URL: `https://api.sanroai.com/api/v1` (production) or `http://localhost:4000/api/v1` (development)
Spec: `http://localhost:4000/docs` (Swagger/OpenAPI, non-production only)

Responses return payloads directly; errors use the shape:
`{ code: string, message: string, requestId: string, statusCode: number, details?: unknown[] }`.

## Security

- **CORS**: Production allows only `sanroai.com`, `app.sanroai.com`, `www.sanroai.com`
- **JWT Secret**: Min 32 chars; production refuses dev default
- **Rate Limiting**: Global 120/min; auth-specific (login 10/min, forgot-password 3/min, register 5/min)
- **RBAC**: `@Roles()` on all mutation endpoints
- **Validation**: Zod schemas on all mutation bodies, `forbidUnknownValues: true`
- **File Upload**: 10MB limit, MIME validation on imports
- **Forgot-Password**: Raw token no longer returned in API response

## Authentication

| Endpoint | Method | Auth | Rate Limit | Notes |
| --- | --- | --- | --- | --- |
| `/health` | GET | no | — | Returns `{ status: "ok", database: "connected", timestamp, uptime, version }` |
| `/auth/login` | POST | no | 10/min | body `{ email, password }` → `LoginResponse { accessToken, refreshToken, user, memberships, institution? }` |
| `/auth/register-institution` | POST | no | 5/min | body `{ institutionName, institutionType, adminName, adminEmail, adminPhone?, adminPassword }` → same `LoginResponse` |
| `/auth/refresh` | POST | no | — | body `{ refreshToken }` → new tokens |
| `/auth/me` | GET | token | — | returns current user with memberships |
| `/auth/logout` | POST | token | — | invalidates refresh token |
| `/auth/forgot-password` | POST | no | 3/min | body `{ email }` → `{ success: true }` (token sent via email, not API) |
| `/auth/reset-password` | POST | no | — | body `{ token, password }` |
| `/auth/change-password` | POST | token | — | body `{ currentPassword, newPassword }` |
| `/auth/switch-context` | POST | token | — | body `{ institutionId, role }` → new tokens |

**Token format**: `Authorization: Bearer <accessToken>` (HS256 JWT; expiry 1 day).

## Curriculum

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/curriculum/boards` | GET | token | List boards |
| `/curriculum/grades` | GET | token | List grades (filter by board) |
| `/curriculum/subjects` | GET | token | List subjects (filter by grade) |
| `/curriculum/chapters` | GET | token | List chapters (filter by subject) |
| `/curriculum/topics` | GET | token | List topics |
| `/curriculum/concepts` | GET | token | List concepts |
| `/curriculum/tree` | GET | token | Full curriculum tree |
| `/curriculum/boards` | POST | token | INSTITUTION_ADMIN only — create board |
| `/curriculum/subjects` | POST | token | INSTITUTION_ADMIN only — create subject |
| `/curriculum/chapters` | POST | token | INSTITUTION_ADMIN only — create chapter |
| `/curriculum/topics` | POST | token | INSTITUTION_ADMIN, TEACHER — create topic |
| `/curriculum/concepts` | POST | token | INSTITUTION_ADMIN, TEACHER — create concept |

## Questions

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/questions` | GET | token | filters: subjectId, chapterId, type, difficulty, status |
| `/questions/:id` | GET | token | single question |
| `/questions` | POST | token | INSTITUTION_ADMIN, TEACHER — create question (Zod validated) |
| `/questions/:id` | PATCH | token | INSTITUTION_ADMIN, TEACHER — update question (Zod validated) |
| `/questions/:id` | DELETE | token | INSTITUTION_ADMIN, TEACHER — delete question |
| `/questions/:id/review` | POST | token | INSTITUTION_ADMIN, TEACHER — approve/reject (Zod validated) |
| `/questions/ai-generate` | POST | token | INSTITUTION_ADMIN, TEACHER — generate with AI |

## Papers

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/papers` | GET | token | list papers |
| `/papers` | POST | token | INSTITUTION_ADMIN, TEACHER — generate paper (Zod validated) |
| `/papers/:id` | GET | token | paper detail |
| `/papers/:id/duplicate` | POST | token | INSTITUTION_ADMIN, TEACHER — duplicate paper |
| `/papers/:id/regenerate` | POST | token | INSTITUTION_ADMIN, TEACHER — regenerate question (Zod validated) |
| `/papers/:id/validate` | GET | token | validate paper |
| `/papers/:id/preview` | GET | token | HTML preview (query: kind=STUDENT|ANSWER_KEY) |
| `/papers/:id/export` | POST | token | INSTITUTION_ADMIN, TEACHER — export as PDF |
| `/papers/:id/status` | PATCH | token | update paper status |

## Assessments

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/assessments` | GET | token | list all assessments |
| `/assessments/my` | GET | token | student view: assignments + attempts |
| `/assessments` | POST | token | create assessment (Zod validated) |
| `/assessments/:id` | GET | token | assessment detail + questions |
| `/assessments/:id/publish` | POST | token | publish to groups |
| `/assessments/:id/start` | POST | token | student starts attempt |
| `/assessments/attempts/:attemptId/answers` | POST | token | save answers (batch) |
| `/assessments/attempts/:attemptId/submit` | POST | token | submit attempt (auto-grade) |
| `/assessments/attempts/:attemptId` | GET | token | get attempt result |

## Diagnosis / Remediation

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/diagnosis/my` | GET | token | my diagnostic results |
| `/diagnosis/students/:studentId` | GET | token | student diagnostics (teacher) |
| `/remediation/my` | GET | token | my remediation plans |
| `/remediation/plans` | GET | token | all plans (teacher) |
| `/remediation/weak` | GET | token | weak concepts |
| `/remediation/items/:id/status` | POST | token | INSTITUTION_ADMIN, TEACHER — mark item complete (Zod validated) |
| `/remediation/retest` | POST | token | INSTITUTION_ADMIN, TEACHER — request retest |

## Dashboard

| Endpoint | Method | Roles | Returns |
| --- | --- | --- | --- |
| `/dashboard/super-admin` | GET | SUPER_ADMIN | `{ platform: { institutions, activeStudents, activeTeachers, assessments, institutionsByType } }` |
| `/dashboard/institution` | GET | INSTITUTION_ADMIN | groups, teachers, students |
| `/dashboard/teacher` | GET | TEACHER, INSTITUTION_ADMIN | classes, papers, assessments |
| `/dashboard/student` | GET | STUDENT | `{ profile, gamification, masterySummary, weakConcepts, recentAttempts, pendingAssignments, activeRemediationPlans }` |
| `/dashboard/parent` | GET | PARENT, INSTITUTION_ADMIN | linked students, attempts |

## People

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/students` | GET | token | list students |
| `/students` | POST | token | INSTITUTION_ADMIN, TEACHER — create student (Zod validated) |
| `/students/:id` | GET | token | student detail |
| `/students/:id` | PATCH | token | INSTITUTION_ADMIN, TEACHER — update student (Zod validated) |
| `/students/:id/deactivate` | POST | token | INSTITUTION_ADMIN, TEACHER — deactivate |
| `/students/:id/activate` | POST | token | INSTITUTION_ADMIN, TEACHER — activate |
| `/students/:id/move` | POST | token | INSTITUTION_ADMIN, TEACHER — move student (Zod validated) |
| `/students/:id/link-parent` | POST | token | INSTITUTION_ADMIN, TEACHER — link parent |
| `/teachers` | GET | token | list teachers |
| `/teachers` | POST | token | INSTITUTION_ADMIN — create teacher (Zod validated) |
| `/teachers/:id/deactivate` | POST | token | INSTITUTION_ADMIN — deactivate |
| `/teachers/:id/activate` | POST | token | INSTITUTION_ADMIN — activate |
| `/teachers/:id/assign-groups` | POST | token | INSTITUTION_ADMIN, TEACHER — assign groups |
| `/parents` | GET | token | list parents |
| `/parents/:id/link-student` | POST | token | link student to parent |
| `/parents/me/dashboard` | GET | token | parent dashboard |

## Imports

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/imports/upload` | POST | token | INSTITUTION_ADMIN, TEACHER — bulk import Excel (10MB limit, MIME validated) |
| `/imports` | GET | token | list import jobs |
| `/imports/:jobId/commit` | POST | token | INSTITUTION_ADMIN, TEACHER — commit import |
| `/imports/:jobId` | GET | token | import job detail |

## AI / Chat

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/ai/explain` | POST | token | AI explanation of concept/chapter |
| `/ai/chat` | POST | token | AI chat (used by mobile) |
| `/chat/ask-sanro` | POST | token | AI chat (used by web) |

## Institutions

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/institutions/mine` | GET | token | get institution details |
| `/institutions/mine` | PATCH | token | INSTITUTION_ADMIN — update institution (Zod validated) |
| `/institutions/mine/stats` | GET | token | institution stats |

## Users

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/users/me` | GET | token | current user profile |
| `/users/me` | PATCH | token | update profile |
| `/users/me/notifications/unread` | GET | token | unread notification count |
| `/users/me/notifications/read-all` | POST | token | mark all notifications read |

## Important Notes

- **Validation errors** return status 400 with `details[]` (each `{ path, message }`).
- **Unauthorized** returns 401 with `{ code: "UNAUTHORIZED" | "HTTP_ERROR", message }`.
- **Forbidden** returns 403 (wrong role / not assigned).
- **Not found** returns 404.
- **Conflict** returns 409 (e.g., duplicate attempt submission).
- **Rate limit** returns 429 (too many requests).
