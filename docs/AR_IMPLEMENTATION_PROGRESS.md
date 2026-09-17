# AR / 3D Learning — Implementation Progress

Status tracker for the SANRO AI AR/3D learning mandate and the Android APK build.

## Overview

SANRO now treats AR/3D models as a first-class, curriculum-mapped learning artifact rather than a
content library item. A model is authored as a draft, validated server-side, mapped to a concept,
reviewed, approved, published, and then surfaced on the concept page for students.

- **Source of truth for metadata:** PostgreSQL (`ArContent`, `ArContentVersion`, `ArActivity`).
- **Source of truth for binaries:** object storage (R2 when configured, local disk fallback). Binaries
  are never stored in Postgres.
- **Delivery:** short-lived signed URLs for stored models; static paths for the bundled demo models.
- **Honesty rule:** a model is never marked valid when it has not been verified. USDZ and any document
  that cannot be fully parsed are reported as warnings/incomplete with "manual review required".

## Data Model (`apps/api/prisma/schema.prisma`)

- `ContentType` gained `AR` (additive; existing `MODEL_3D` untouched).
- New enums: `ArModelFormat` (GLB, GLTF, USDZ), `ArValidationStatus`
  (PENDING, VALID, WARNINGS, INVALID, INCOMPLETE), `ArActivityType`
  (AR_OPENED, AR_STARTED, AR_MODEL_INTERACTION, AR_QUICK_CHECK_STARTED,
  AR_QUICK_CHECK_COMPLETED, AR_COMPLETED).
- New models: `ArContent`, `ArContentVersion`, `ArActivity`.
  - Cross-module references to concept/chapter/subject/board/institution/user use **plain denormalized
    UUID fields** (no Prisma relations) to keep the change additive and avoid edits to existing models.
- Reuses the existing `ContentLifecycleStatus` enum: `DRAFT -> REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED`.

Migration: `apps/api/prisma/migrations/20260917040000_ar_3d_learning/migration.sql`.

## Lifecycle & Publish Guards

Transitions (`apps/api/src/ar/ar.service.ts`):

```
DRAFT:     REVIEW | ARCHIVED
REVIEW:    APPROVED | DRAFT | ARCHIVED
APPROVED:  PUBLISHED | REVIEW | ARCHIVED
PUBLISHED: ARCHIVED | APPROVED
ARCHIVED:  DRAFT
```

Publishing is blocked unless the record has a stored model, a concept mapping, a preview image, and a
validation status that is not `INVALID`/`PENDING`. `INCOMPLETE` also requires a recorded manual review.
Publishing takes a version snapshot and stamps `publishedAt`.

## API (`apps/api/src/ar/`)

- `ar-validation.service.ts` — extension + MIME allow-list, size caps (model 50 MB, image 5 MB),
  GLB magic/version/length + JSON-chunk parsing, glTF document inspection, USDZ container check.
- `ar.service.ts` — student/teacher reads, signed model URL, quick check (real `Question` bank),
  activity recording, admin CRUD/upload/replace/transition/versions/delete/usage.
- `ar.controller.ts` — `@Controller('ar')`, admin routes declared before `:id` routes.
- `ar.module.ts` — registered in `app.module.ts`.

Endpoints:

| Method | Path | Roles | Parent-restricted |
| --- | --- | --- | --- |
| GET | `/ar/admin/list` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| GET | `/ar/admin/usage` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| POST | `/ar/admin` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| GET | `/ar/admin/:id` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| PATCH | `/ar/admin/:id` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| POST | `/ar/admin/:id/model` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| POST | `/ar/admin/:id/preview` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| POST | `/ar/admin/:id/replace` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| POST | `/ar/admin/:id/transition` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| GET | `/ar/admin/:id/versions` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| DELETE | `/ar/admin/:id` | SUPER_ADMIN, INSTITUTION_ADMIN | no |
| GET | `/ar/teacher` | STAFF | no |
| GET | `/ar/concept/:conceptId` | STAFF, STUDENT | yes |
| GET | `/ar` | STAFF, STUDENT | yes |
| GET | `/ar/:id/quick-check` | STAFF, STUDENT | yes |
| POST | `/ar/:id/quick-check` | STAFF, STUDENT | yes |
| POST | `/ar/:id/activity` | STAFF, STUDENT | yes |
| GET | `/ar/:id/model-url` | STAFF, STUDENT | yes |
| GET | `/ar/:id` | STAFF, STUDENT | yes |

Tenant scoping: institution admins/teachers only see their own or `PUBLIC` records. Students only ever
receive `PUBLISHED` records. Parents are blocked from all AR learning routes by `ParentContentGuard`.

## Web

- `apps/web/lib/ar-hooks.ts` — TanStack Query hooks for concept cards, signed model URL, quick check,
  activity, and admin management.
- `apps/web/components/ar/Model3DViewer.tsx` — lazy-loads `@google/model-viewer` from CDN only when a
  model is rendered, with loading/error/retry, camera reset, fullscreen, AR button, and hotspot support.
- `apps/web/components/ar/ConceptArPanel.tsx` — concept-scoped AR experience (model, objective,
  instructions, labelled parts, quick check, activity tracking).
- Concept detail page (`apps/web/app/(dashboard)/app/learn/concepts/[conceptId]/page.tsx`) shows an
  **AR / 3D** tab only when published AR content exists for the concept.
- `apps/web/app/(dashboard)/app/ar/page.tsx` — admin authoring: create, edit, upload/replace model and
  preview, lifecycle transitions, validation report, usage stats, delete. Nav entries added for
  super admins and staff.

## Mobile (`apps/mobile`)

- `lib/ar-hooks.ts` — AR queries/mutations over `apiAuthed`.
- `lib/ar-assets.ts` — resolves relative asset paths against `EXPO_PUBLIC_WEB_URL` (default
  `https://sanroai.com`).
- `lib/ar-capability.ts` — detects a native AR runtime by inspecting `NativeModules`. If none is present
  it reports `available: false` and explains that the interactive 3D preview is used instead. AR is
  never faked.
- `components/ArModelViewer.tsx` — `react-native-webview` + `model-viewer` for real rotate/zoom/pinch,
  with poster fallback, retry, and failure states.
- `components/ArConceptPanel.tsx` — concept-scoped AR panel (viewer, objective, instructions, hotspots,
  quick check with real questions, activity tracking).
- Concept screen (`apps/mobile/app/concept/[conceptId].tsx`) shows the **AR / 3D** tab only when
  published AR content exists.

Dependency added: `react-native-webview@13.12.5` (bundled in Expo Go SDK 52; no config plugin needed).

## Demo Content & Assets

- `scripts/generate-demo-models.mts` generates license-free GLB models and SVG thumbnails into
  `apps/web/public/models/`: cube, cuboid, cylinder, cone, sphere, prism, pyramid, atom.
- `apps/api/prisma/seed-ar.ts` (hooked into `seed.ts`) seeds 8 AR records, concept-mapped to real CBSE
  concepts (e.g. Atom -> "Subatomic Particles", Cone/Cylinder/Sphere -> "Cylinder, Cone, Sphere",
  Prism -> "Prism and Spectrum", Cube -> "Combination of Solids"), plus 2 drafts for review flow.
- Seeding is idempotent and safe to run repeatedly.

## Tests

- `apps/api/src/ar/ar-validation.service.spec.ts` — 10 tests: extension sanitisation/path traversal,
  MIME rejection, valid GLB with polygon counting, empty file, invalid magic, oversized file, glTF
  external references, unverified USDZ, corrupt JSON.
- Existing suites: role/parent guards, learning, mastery, student-identity.
- Totals: **41/41 API tests passing**; `pnpm -r typecheck` clean across all 6 packages.

## Configuration

| Concern | Local | Production |
| --- | --- | --- |
| API base (web) | `NEXT_PUBLIC_API_URL` (default prod) | `https://api.sanroai.com/api/v1` |
| API base (mobile) | `EXPO_PUBLIC_API_URL` | `https://api.sanroai.com/api/v1` |
| Asset base (mobile) | `EXPO_PUBLIC_WEB_URL` | `https://sanroai.com` |
| Storage | local disk fallback | Cloudflare R2 via `StorageService` |

No localhost references are introduced by AR/3D.

## Android APK

- EAS account: `sanroai` (`sanroaiapp@gmail.com`). Project: `@sanroai/sanro-ai`
  (`eb098800-6294-4a77-ae94-fe34128a8364`). This replaced a stale `projectId` that belonged to a
  different account and caused "Entity not authorized" errors.
- `apps/mobile/eas.json`: `preview` profile builds an **APK**; `production` builds an app bundle. All
  profiles inject `EXPO_PUBLIC_API_URL=https://api.sanroai.com/api/v1`.
- `apps/mobile/app.json`: name "Sanro AI", slug `sanro-ai`, owner `sanroai`, package/bundle
  `com.sanro.ai`, version `1.0.0`, `newArchEnabled: true`.
- Output: `releases/sanroai-latest.apk`.

Build result:

| Field | Value |
| --- | --- |
| EAS build ID | `9b2fb441-8de2-4e54-a53e-e7bd3a8e21b8` |
| Status | FINISHED |
| Artifact | `releases/sanroai-latest.apk` (78,061,514 bytes) |
| Package | `com.sanro.ai` (versionCode 1, versionName 1.0.0) |
| Label | Sanro AI |
| minSdk / targetSdk | 24 / 34 |
| ABIs | arm64-v8a, armeabi-v7a, x86, x86_64 |
| Bundle check | production API present, no localhost, AR concept endpoint + WebView 3D viewer present |

## Known Limitations / Blockers

- **Native AR runtime:** no native AR module (e.g. `expo-ar`, ViroReact, SceneView) is bundled, so the
  mobile app runs in interactive 3D preview mode. Adding one requires a custom dev build and a config
  plugin; the capability detector will pick it up automatically once present.
- **`www.sanroai.com` DNS:** record missing at Cloudflare (authoritative NXDOMAIN). A Vercel redirect
  has been added; the CNAME (`www -> cname.vercel-dns.com`, proxied) still needs to be created at
  Cloudflare. This is outside the repository.
- Static demo models are served by the web app at `/models/*`; production uploads use object storage.

## Verification Commands

```bash
pnpm -r typecheck
pnpm --filter @sanro/api test
pnpm build
pnpm --filter @sanro/api db:push        # local only
pnpm --filter @sanro/api db:seed        # local only, idempotent
```

## Change Log

- 2026-09-17: AR/3D schema, migration, API module, storage `exists()`.
- 2026-09-17: Demo GLB/SVG assets + idempotent AR seed (8 records).
- 2026-09-17: Web concept AR tab, lazy viewer, admin management page, nav entries.
- 2026-09-17: Mobile AR hooks, capability detection, WebView 3D viewer, concept AR tab.
- 2026-09-17: AR validation tests added (41/41 API tests green); all packages typecheck clean; `pnpm build` 6/6.
- 2026-09-17: EAS project recreated under the `sanroai` account; Android APK built and verified (see table above).
