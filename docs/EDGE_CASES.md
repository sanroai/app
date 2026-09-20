# SANRO AI — Edge Cases (Master Audit)

Mandatory test matrix. Every phase must verify its relevant category before
closing.

## AUTH
- wrong password · expired JWT · refresh failure · logout · revoked role ·
  changed permissions · disabled user

## TENANCY
- wrong institution · wrong group · direct object-ID access · cross-tenant
  content · cross-tenant student

## STUDENT
- no class · no subject · no content · no assessment · no weak concepts ·
  one weak concept · many weak concepts · insufficient evidence · transferred
  class · multiple devices

## ASSESSMENT
- timeout · duplicate submit · refresh · network loss · app killed · empty
  paper · invalid question · deleted question · edited question after attempt ·
  late attempt

## CONTENT
- duplicate · unpublished · archived · wrong mapping · deleted source ·
  corrupt PDF · OCR failure · huge file · private YouTube · deleted YouTube ·
  broken model · expired signed URL

## AI
- timeout · malformed JSON · hallucination · duplicate questions · wrong answer
  · wrong concept · insufficient source evidence · partial generation

## IMPORT
- duplicate students · duplicate content · malformed CSV · missing columns ·
  invalid email · invalid grade · partial failure · retry

## PARENT
- no child · multiple children · removed relationship · unauthorized learning
  access

## TEACHER
- no class · removed from class · changed subject · unauthorized student

## AR
- no AR support · camera denied · camera unavailable · 3D fallback · huge model
  · corrupt model · missing texture · low memory · offline · interrupted
  download

## PDF
- short paper · long paper · page breaks · answer key · images · print ·
  download · mobile

## MOBILE
- slow network · offline · back button · keyboard · safe area · rotation ·
  background · app termination · stale token

## SUBSCRIPTION / VALIDITY / LIMITS
| Scenario | Expected behaviour (see docs/INSTITUTION_MANAGEMENT.md; Direct SANRO: docs/PEOPLE_MANAGEMENT.md) |
|---|---|
| Subscription ends while a user is mid-session | Lazy expiry flips on next `evaluate()`; in-flight JWT is valid until the guard re-checks (≤15 s cache); next entitlement-gated request → 403 block code; refresh → `BlockedAccountResponse` |
| Expired tenant tries to log in | login returns 200 `BlockedAccountResponse { state: SUBSCRIPTION_EXPIRED, … }`, no tokens; stale refresh session revoked |
| Suspended tenant (even with ACTIVE subscription) | blocked `INSTITUTION_SUSPENDED` at login + guard regardless of subscription |
| Archived tenant | blocked `INSTITUTION_ARCHIVED`; unknown institution id also falls back to ARCHIVED |
| PENDING tenant | blocked `INSTITUTION_PENDING` until activated |
| Archive / suspend data preservation | Lazy expiry never deletes data; suspend/archive only flips status (admin status patch also DEACTIVATES member records — members stay blocked by status alone too) |
| Limit reduced below current usage | No deletion/refusal today; `limitExceeded=true` surfaced in account-state; new student creates fail `SEAT_LIMIT_REACHED` |
| Parent on expired tenant | Same blocked login/guard path as students (no special parent carve-out) |
| Trial ends | Same as subscription expiry (effective EXPIRED when `endsAt` passes) |
| SUBSCRIPTION_EXPIRED re-entering as SUPER_ADMIN | Super admin bypasses entitlement entirely (no institution binding) |
| `endsAt = null` | Never expires (expired flag only when `endsAt` non-null and past) |
| Grace window | `gracePeriodDays` stored + surfaced; NOT yet applied to expiry math (default 0) |
| Concurrent admin ops (two set-subscription calls) | Both new rows are created; each `updateMany` cancels prior ACTIVE/TRIAL — last-created wins by `createdAt` ordering; no locking/version guard today |
| Seat limit exactly full | `current + additional > limit` → `SEAT_LIMIT_REACHED` (student create); `USER_LIMIT_REACHED` helper defined but unused |
| Bulk import past limit | Not yet enforced (imports path has no seat check) |
| User disabled / membership deactivated | `USER_DISABLED`/`MEMBERSHIP_DEACTIVATED` checked BEFORE entitlement → blocked even if tenant is healthy |
| Entitlement cache staleness | Admin mutations do not invalidate → decision lags ≤15 s; force `evaluate(institutionId, true)` for immediate read |

Each verified case is recorded in CHANGELOG / REBUILD_PROGRESS per phase.