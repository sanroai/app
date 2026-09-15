# Production Deployment Spec — Sanro AI (Master Prompt §86–111)

> Deployment is part of the task.
>
> Do NOT stop after local development.
>
> **Do not stop at `pnpm build`. The task is incomplete until you have deployed the web/API, connected the production database, configured production environment variables, removed localhost dependencies, verified the live URLs, and tested the complete student → diagnosis → remediation → retest flow against production.**
>
> Code → TEST → BUILD → DEPLOY → CONFIGURE → VERIFY → LIVE

---

## 86. PRODUCTION DEPLOYMENT — MAKE SANRO LIVE

Deployment is part of the task.

Do NOT stop after local development.

After implementation and QA, deploy SANRO AI so that the actual production application is accessible on the internet.

The goal is:

```
CODE
→ TEST
→ BUILD
→ DEPLOY
→ CONFIGURE
→ VERIFY
→ LIVE
```

Do not declare the project complete until production deployment has been attempted and verified.

## 87. PRODUCTION ARCHITECTURE

Use the existing architecture and deploy each required component.

WEB:

Next.js application

Recommended:

Vercel

API:

NestJS application

Recommended:

Railway / Render / AWS equivalent

DATABASE:

Managed PostgreSQL

Use production PostgreSQL.

Do NOT expose the local PostgreSQL database to the internet.

STORAGE:

Cloudflare R2 / S3

CDN:

Cloudflare where appropriate.

REDIS:

Managed Redis if required by BullMQ/background jobs.

MOBILE:

Expo / EAS

Android production build.

Prepare iOS-compatible configuration even if App Store submission is later.

## 88. PRODUCTION DOMAINS

Use the SANRO domain:

sanroai.com

Recommended structure:

https://sanroai.com

Public marketing website.

Application:

https://app.sanroai.com

API:

https://api.sanroai.com

Use environment variables so these URLs can be changed without code changes.

If DNS access is available, configure the required DNS records.

If DNS credentials/access are not available, clearly document the exact records that the owner must add.

Do not fabricate successful DNS configuration.

## 89. PRODUCTION ENVIRONMENT VARIABLES

Create proper production environment configuration.

NEVER commit secrets.

Required environment variables should include whatever the existing code actually requires, such as:

```
DATABASE_URL
JWT_SECRET
JWT_REFRESH_SECRET
API_URL
NEXT_PUBLIC_API_URL
OPENAI_API_KEY
REDIS_URL
STORAGE credentials
R2/S3 configuration
SENTRY configuration
POSTHOG configuration
CORS configuration
other required production variables
```

Inspect the actual repository and generate the correct variable list.

Do not invent variable names if the code already uses different names.

Create/update:

```
.env.example
```

with variable names only.

Never place real secrets inside:

- Git
- source code
- mobile bundle
- screenshots
- logs
- README
- client-side JavaScript

## 90. PRODUCTION DATABASE

Production database must be separate from:

- `sanro_dev`
- `sanro_test`

Never use development credentials in production.

Run Prisma migrations/schema deployment correctly.

Do not blindly run destructive database reset commands against production.

Do NOT use:

```
prisma migrate reset
```

or equivalent destructive operations on production.

Verify:

- schema
- indexes
- constraints
- seed requirements
- tenant isolation
- connection pooling

If seed data is appropriate for production, make it safe and deliberate.

Do not expose demo accounts publicly unless intentionally enabled.

## 91. PRODUCTION CORS

Configure CORS correctly.

Allow only required production origins.

For example:

- https://sanroai.com
- https://app.sanroai.com

Do not use:

```
*
```

for production CORS when credentials/authentication are involved.

Ensure mobile API access also works securely.

## 92. PRODUCTION AUTHENTICATION

Verify production JWT configuration.

Use strong production secrets.

Verify:

- login
- refresh token
- logout
- expired access token
- expired refresh token
- unauthorized access
- role authorization

Test all roles:

- SUPER_ADMIN
- INSTITUTION_ADMIN
- TEACHER
- STUDENT
- PARENT

Never use:

```
Sanro@123
```

as a production administrative password.

Demo accounts may remain in development/staging.

If demo accounts are intentionally enabled in production, clearly mark them as demo-only and prevent them from having dangerous production privileges.

## 93. FILE STORAGE

Configure production object storage.

Private student/institution files must not be publicly accessible.

Use:

- signed URLs
- controlled access
- tenant-aware authorization

Verify:

- PDF upload
- content retrieval
- video/content assets
- paper exports
- report exports

## 94. PDF PRODUCTION

Verify PDF generation in the actual production environment.

Test:

- Question paper
- Answer key
- A4 formatting
- Marathi/Unicode text
- page breaks
- headers
- footers
- student fields

Do not assume PDF generation works simply because local development works.

Production browser/runtime dependencies must be correctly configured.

## 95. AI PRODUCTION

Configure the AI provider only on the server.

Verify:

- Ask SANRO
- question generation
- explanations
- practice generation
- diagnosis
- remediation recommendations

Handle:

- API failure
- timeout
- rate limit
- invalid response
- empty response

The application must not crash if the AI provider is unavailable.

Never expose OPENAI_API_KEY to:

- Next.js client
- React Native
- browser
- mobile bundle

## 96. PRODUCTION ERROR HANDLING

Configure Sentry or the existing error tracking system if present.

Verify:

- frontend errors
- API errors
- unhandled exceptions

Do not expose stack traces to end users.

Every important server request should have request IDs.

## 97. HEALTH CHECKS

Implement/verify API health endpoints.

Example:

```
GET /api/v1/health
```

It should verify basic application health.

If appropriate, provide separate readiness checks for:

- database
- redis
- critical dependencies

Do not expose sensitive infrastructure details.

## 98. PRODUCTION SECURITY

Before going live verify:

- HTTPS
- secure headers
- CORS
- rate limiting
- authentication
- authorization
- tenant isolation
- signed file URLs
- input validation
- SQL injection protection
- XSS protection
- CSRF considerations where applicable
- secure cookies where used
- secret management
- file upload restrictions
- request size limits

Do not expose:

- database
- Redis
- internal admin endpoints
- secret keys

to the public internet unnecessarily.

## 99. WEB DEPLOYMENT

Deploy the Next.js web application.

Verify production build.

Verify:

- `/` landing page
- `/app` student dashboard
- teacher dashboard
- institution admin
- parent
- super admin
- learning pages
- concept pages
- assessment pages
- question papers
- reports
- Ask SANRO
- authentication

All protected routes must correctly redirect unauthorized users.

Verify direct URL navigation.

Verify refresh on protected routes.

Verify browser back/forward behavior.

## 100. API DEPLOYMENT

Deploy NestJS API.

Verify:

- `GET health`
- authentication
- refresh
- curriculum
- content
- questions
- assessments
- attempts
- diagnosis
- mastery
- remediation
- retest
- papers
- imports
- AI
- reports

Verify production API can communicate with production database.

## 101. MOBILE PRODUCTION

The mobile application must also be prepared for real use.

Configure Expo/EAS.

Production API URL must NOT be:

```
http://localhost:4000/api/v1
```

Replace development URL through environment/configuration.

Use the production API:

```
https://api.sanroai.com/api/v1
```

or the actual deployed API URL.

Verify:

- login
- token persistence
- home
- learn
- concept
- practice
- quiz
- flashcards
- challenge
- Ask SANRO
- tests
- assessment attempt
- autosave
- results
- progress
- logout

The mobile app must never attempt to call localhost in production.

## 102. ANDROID RELEASE

Prepare a production Android build using Expo/EAS.

Configure:

- app name
- package/bundle identifier
- icon
- splash screen
- version
- build number
- permissions
- production API URL

Use a stable package identifier such as:

```
com.sanroai.app
```

unless an existing identifier is already configured.

Do not overwrite an existing published identifier without checking.

Build an Android production artifact.

If credentials are required and unavailable, stop only at the credential boundary and document exactly what is needed.

Do not claim the APK/AAB is published unless it actually is.

## 103. IOS PREPARATION

Keep the React Native/Expo project iOS-compatible.

Configure:

- bundle identifier
- app metadata
- icons
- splash
- permissions
- production API

Prepare EAS configuration.

If Apple Developer credentials are unavailable, prepare everything possible but clearly report that App Store submission requires the owner's Apple Developer account/credentials.

Do not falsely claim App Store publication.

## 104. WEB DOMAIN / DNS

If deployment credentials and DNS access are available:

- configure `sanroai.com`
- configure `app.sanroai.com`
- configure `api.sanroai.com`
- enable HTTPS
- verify DNS resolution
- verify certificate

If access is unavailable:

- do not pretend it was configured
- provide exact DNS instructions in the final report

## 105. PRODUCTION SMOKE TEST

After deployment perform an actual production smoke test.

Test:

1. Open public website.
2. Open application.
3. Login as student.
4. Open Learn.
5. Open a real chapter.
6. Open a concept.
7. Watch/open content.
8. Practice.
9. Quick Quiz.
10. Flashcards.
11. Challenge.
12. Ask SANRO.
13. Open assessment.
14. Submit assessment.
15. Verify result.
16. Verify diagnosis.
17. Verify Fix This.
18. Complete remediation.
19. Retest.
20. Verify improvement.

Then test teacher:

21. Login as teacher.
22. View students.
23. View weak concepts.
24. Assign Fix.
25. View assessment data.
26. Generate question paper.
27. Preview paper.
28. Export PDF.
29. View report.

Then parent:

30. Login as parent.
31. View child.
32. View progress.
33. View improvement.

Then verify tenant security.

## 106. PRODUCTION MOBILE SMOKE TEST

Test the actual mobile build against production API.

Verify:

- launch
- login
- SecureStore
- refresh token
- Home
- Learn
- Concept
- Practice
- Quiz
- Flashcards
- Challenge
- Ask SANRO
- Tests
- assessment
- autosave
- result
- logout

Test at least one Android device/emulator.

Do not claim mobile production readiness without testing the actual production API connection.

## 107. PRODUCTION MONITORING

Ensure the deployed system has basic visibility into:

- API errors
- web errors
- AI failures
- database failures
- background job failures
- authentication failures

Use the existing Sentry/PostHog architecture.

Do not add excessive observability complexity.

## 108. BACKUPS

Verify that production PostgreSQL has backups enabled through the managed provider.

Do not assume backups exist.

If the provider exposes backup configuration, verify it.

If backup access is unavailable, document it.

## 109. DEPLOYMENT SAFETY

Never:

- expose secrets
- reset production DB
- delete production data
- overwrite DNS blindly
- disable security to make deployment work
- use wildcard CORS unnecessarily
- use localhost in production
- hardcode production credentials
- commit .env files
- claim deployment succeeded without verifying it

If deployment fails:

- diagnose the actual failure
- fix what can be fixed

If credentials/access are required:

- stop at that boundary and clearly state what credential/access is needed

## 110. PRODUCTION DEFINITION OF DONE

SANRO is considered deployed only when:

- [ ] Web production build succeeds
- [ ] API production build succeeds
- [ ] Production database connected
- [ ] Production migrations applied safely
- [ ] Production environment variables configured
- [ ] CORS configured
- [ ] HTTPS active
- [ ] Web reachable
- [ ] API reachable
- [ ] Authentication works
- [ ] Role authorization works
- [ ] Tenant isolation verified
- [ ] Student journey verified
- [ ] Teacher journey verified
- [ ] Parent journey verified
- [ ] Question paper PDF verified
- [ ] AI verified
- [ ] File storage verified
- [ ] Reports verified
- [ ] Mobile connects to production API
- [ ] Android production build created
- [ ] Monitoring configured
- [ ] No localhost production references
- [ ] No secrets committed
- [ ] Production smoke test passed

## 111. FINAL DEPLOYMENT REPORT

At the end provide:

PRODUCTION WEB:
actual deployed URL

PRODUCTION APP:
actual deployed URL

PRODUCTION API:
actual deployed URL

DATABASE:
provider/status only
NEVER output credentials.

ANDROID:
build status
artifact location if created

IOS:
prepared / submitted / published

DOMAIN:
configured / pending DNS access

MONITORING:
status

FINAL:

Web:
PASS/FAIL

API:
PASS/FAIL

Database:
PASS/FAIL

Mobile:
PASS/FAIL

Smoke test:
PASS/FAIL

List only genuine remaining blockers.

If something could not be deployed because credentials/access were unavailable, say exactly:

```
BLOCKED — requires [specific access].
```

Do not say "done" when it is not actually live.

---

## Recommended SANRO Production Topology

For SANRO specifically, keep the production setup as simple as possible:

```
sanroai.com
      │
      ├── Vercel
      │     └── Next.js Web
      │
      └── Cloudflare DNS
             │
             ├── app.sanroai.com
             │       └── Next.js application
             │
             └── api.sanroai.com
                     └── NestJS API
                            │
                            ├── Managed PostgreSQL
                            ├── Redis
                            ├── R2/S3
                            └── OpenAI
```

And:

```
Android / iOS
      │
      ▼
api.sanroai.com
      │
      ▼
Same SANRO backend
```

**Do not create separate backend logic for web and mobile.**

The mobile app should simply become another client of the same production API.