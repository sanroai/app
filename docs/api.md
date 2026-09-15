# API

Base URL: `http://localhost:4000/api/v1`
Spec: `http://localhost:4000/docs` (Swagger/OpenAPI)

Responses return payloads directly; errors use the shape:
`{ code: string, message: string, requestId: string, statusCode: number, details?: unknown[] }`.

## Authentication

| Endpoint | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/health` | GET | no | Returns `{ status: "ok", database: "connected", timestamp, uptime, version }` |
| `/auth/login` | POST | no | body `{ email, password }` → `LoginResponse { accessToken, refreshToken, user, memberships, institution? }` |
| `/auth/register-institution` | POST | no | body `{ institutionName, institutionType, adminName, adminEmail, adminPhone?, adminPassword }` → same `LoginResponse` |
| `/auth/refresh` | POST | no | body `{ refreshToken }` → new tokens |
| `/auth/me` | GET | token | returns current user |
| `/auth/logout` | POST | token | invalidates refresh token |
| `/auth/forgot-password` | POST | no | |
| `/auth/reset-password` | POST | no | body `{ token, password }` |

**Token format**: `Authorization: Bearer <accessToken>` (HS256 JWT; expiry 1 day).

## Onboarding / admin

| Endpoint | Method | Auth | Body |
| --- | --- | --- | --- |
| `/imports/teachers` | POST | INSTITUTION_ADMIN | CSV row objects (`{ employeeId, firstName, lastName?, email, phone?, departments? }`) |
| `/imports/students` | POST | INSTITUTION_ADMIN | `{ rows: [{ rollNo, firstName, lastName?, email?, phone?, parentEmail?, parentName?, parentPhone? }] }` |
| `/admin/institutions` | GET | SUPER_ADMIN | query params (status, search, page, limit) |
| `/admin/plans` | GET | SUPER_ADMIN | list plans |

## Question bank

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/questions` | GET | filters: subjectId, chapterId, type, difficulty, status; includes stats; returns `Question[]` |
| `/questions` | POST | teacher/admin creates; body validated by `CreateQuestionSchema`; new question starts `DRAFT` |
| `/questions/:id/approve` | PATCH | sets status to `APPROVED` |
| `/questions/:id` | GET | single question |

## Papers

| Endpoint | Method | Body / query |
| --- | --- | --- |
| `/papers/generate` | POST | `{ title, subjectId, chapterId?, types: { MCQ, SHORT, LONG } }` with marks per type (default 1/2/5). Returns `{ paper: Paper, html: string, pdfUrl: null, warnings: string[] }` |
| `/papers/:id/validate` | GET | `{ totalMarks, questionCount }` (plus `paperservice.validate`) |
| `/papers/:id/preview` | GET | HTML preview (lowercase `<!doctype html>`) |
| `/papers/:id/export/pdf` | GET | HTML→PDF via Playwright (returns `application/pdf`) |
| `/papers` | GET | list papers |

## Assessments

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/assessments` | POST | create from paper/questions; snapshots all questions into `AssessmentQuestion`. Returns `{ assessment: Assessment, questions: AssessmentQuestion[] }` |
| `/assessments/:id/publish` | POST | body `{ assessmentId, groupIds, studentIds }` → creates `AssessmentAssignment` rows |
| `/assessments/my` | GET | student view: returns assignments + attempts |
| `/assessments/:id/start` | POST | student starts an attempt; returns `{ attemptId, attemptIndex, durationMinutes, questions[] }` |
| `/assessments/attempts/:attemptId/answers` | POST | `{ answers: [{ snapshotQuestionId, answer }] }` |
| `/assessments/attempts/:attemptId/submit` | POST | auto-grades objective questions, records score, creates `DiagnosticResult`s + `ConceptMastery` rows, applies weak-concept remediation plans, awards XP. Returns `{ score, maxScore, correctCount, wrongCount, skippedCount, pendingCount, accuracy, timeSpentSeconds }` |
| `/assessments/:id` | GET | teacher/admin: returns `{ assessment, questions: AssessmentQuestion[] }` |

## Diagnosis / remediation

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/diagnosis/:studentId/concept/:conceptId` | GET | mastery level + diagnostic result + suggested remediation |
| `/remediation/plans/:studentId` | GET | active plans + items |

## Dashboard

| Endpoint | Method | Roles | Returns |
| --- | --- | --- | --- |
| `/dashboard/super-admin` | GET | SUPER_ADMIN | `{ platform: { institutions, activeStudents, activeTeachers, assessments, institutionsByType } }` |
| `/dashboard/institution` | GET | INSTITUTION_ADMIN | groups, teachers, students |
| `/dashboard/teacher` | GET | TEACHER, INSTITUTION_ADMIN | classes, papers, assessments |
| `/dashboard/student` | GET | STUDENT | `{ profile, gamification, masterySummary, weakContacts, recentAttempts, pendingAssignments, activeRemediationPlans }` |
| `/dashboard/parent` | GET | PARENT, INSTITUTION_ADMIN | linked students, attempts |

## Important request notes

- **Validation errors** return status 400 with `details[]` (each `{ path, message }`).
- **Unauthorized** returns 401 with `{ code: "UNAUTHORIZED" | "HTTP_ERROR", message }`.
- **Forbidden** returns 403 (wrong role / not assigned).
- **Not found** returns 404.
- **Conflict** returns 409 (e.g., duplicate attempt submission).