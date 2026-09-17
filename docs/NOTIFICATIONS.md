# SANRO AI — Notifications

## 1. Types

- assessment assigned
- assessment due
- assessment result
- remediation available
- retest available
- important institution notification

## 2. Rules

- Avoid spam. Respect notification preferences.
- In-app notifications via Notification table; unread counts polled by clients.
- Parent receives child-oriented notifications (results, weak areas,
  remediation status, improvement).
- Mark single + mark all read endpoints.

## 3. API

- `GET /users/me/notifications`, `GET .../unread`
- `POST /users/me/notifications/:id/read`, `POST .../read-all` (via users
  controller surface)

## 4. Client

- Web: NotificationBell component (+30 s/60 s polling) with entity routing
  (Assessment → /app/assessments, Attempt → /app/assessments, RemediationPlan
  → /app/remediation).
- Mobile: badge surfacing via hooks; part of role-aware navigation.

## 5. Integrity

Notification records never fabricate outcomes — they reference real
assessments/attempts/plans only.