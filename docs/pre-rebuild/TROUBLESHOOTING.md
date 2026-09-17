# TROUBLESHOOTING.md — Known Issues & Solutions

This document captures every recurring error, its root cause, and the exact fix.  
**Always check this file first when encountering a familiar error.**

---

## 1. Build / Typecheck Errors

### `Cannot find name 'paper'` in assessments.service.ts
**Cause:** Variable `paper` scoped inside an `if` block but referenced outside.  
**Fix:** Extract `paperSubjectId` before the if-block:
```ts
let paperSubjectId: string | null = null;
if (data.sourcePaperId) {
  const paper = await this.prisma.questionPaper.findFirst({...});
  paperSubjectId = (paper as any).subjectId ?? null;
  ...
}
const subjectId = data.subjectId || paperSubjectId || undefined;
```

### `Type 'string | null' is not assignable to type 'string | undefined'` (Prisma)
**Cause:** Prisma optional fields need `undefined`, not `null`.  
**Fix:** Use `|| undefined` instead of `|| null` for Prisma optional fields.

### `'subject.name' is possibly null` after making subjectId optional
**Cause:** When a relation field becomes optional, TypeScript requires null-safe access.  
**Fix:** Use optional chaining: `attempt.assessment.subject?.name ?? 'General'`

### `BadRequestException` not found in auth.service.ts
**Cause:** Missing import from `@nestjs/common`.  
**Fix:** Add `BadRequestException` to the import:
```ts
import { BadRequestException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
```

### Mobile typecheck errors (Ionicons, Stack, Tabs JSX component)
**Cause:** React 18 vs React 19 type mismatch in the monorepo. Web uses `@types/react@19`, mobile uses `@types/react@18`.  
**Status:** Pre-existing, expected. Ignore mobile typecheck errors.

---

## 2. Deployment Errors

### Railway: `Not signed in` / `Unauthorized`
**Cause:** `RAILWAY_TOKEN` env var or CLI token expired.  
**Fix:** Get a new token from Railway dashboard → Account Settings → Tokens.  
**Deploy command:**
```bash
$env:RAILWAY_TOKEN="NEW_TOKEN"; railway up --service 590acd10-1017-419c-aa01-0bc828665f20
```

### Vercel: `The specified token is not valid`
**Cause:** Vercel token expired.  
**Fix:** Get a new token from Vercel dashboard → Settings → Tokens.  
**Deploy command:**
```bash
vercel --prod --yes --token NEW_TOKEN
```

### Git push hangs (`git push origin master`)
**Cause:** HTTPS push sometimes hangs on Windows.  
**Fix:** Use inline token URL:
```bash
git push https://ghp_TOKEN@github.com/sanroai/app.git master
```

---

## 3. Schema / Database Errors

### Prisma `subjectId` required but frontend sends optional
**Cause:** Schema had `subjectId String` (required) but assessment creation allows optional subject.  
**Fix:** Make nullable in schema:
```prisma
subjectId String? @db.Uuid
subject   Subject? @relation(fields: [subjectId], references: [id])
```
Then run: `pnpm --filter @sanro/api db:push`

### `studentGrade` filtering not working on learn page
**Cause:** Backend filters by `g.name === studentGrade` but grade names must match exactly (e.g., "10" not "Class 10").  
**Fix:** Already handled — `studentGrade` comes from `student.grade` which stores "10".

---

## 4. UI / UX Bugs

### Dashboard always highlighted when on any /app/* page
**Cause:** `pathname.startsWith('/app/')` matches ALL sub-routes for Dashboard (`/app`).  
**Fix:** Use exact match for Dashboard:
```ts
function isActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app' || pathname === '/app/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

### Gamification progress shows "285/215 to next level"
**Cause:** Backend returned `xpToNext = 500 - xpInLevel` (remaining), frontend displayed as total.  
**Fix:** Backend returns `xpForLevel: 500`, frontend shows `xpInLevel/xpForLevel`.

### Rank shows "#-" when only one student
**Cause:** `getGamificationProfile` didn't compute rank.  
**Fix:** Query all students in institution, sort by XP, find current student's position.

### "NEEDS_INTERVENTION" shown as raw enum text
**Cause:** `titleCase()` function should convert but wasn't being applied consistently.  
**Fix:** Ensure `titleCase(m.level)` is used in Badge components.

### Concept mastery cards not clickable
**Cause:** Cards rendered as plain `<Card>` without Link wrapper.  
**Fix:** Wrap in `<Link href={/app/learn/concepts/${id}}>` with hover styles.

### Student dashboard "weakConcepts" not showing
**Cause:** Backend returned `weakContacts` but frontend expected `weakConcepts`.  
**Fix:** Rename field in dashboard service: `weakConcepts: mastery.filter(...).map(...)`.

### "Ask SANRO" still showing after rename
**Cause:** Layout file `apps/web/app/(dashboard)/layout.tsx` line 75 had old label.  
**Fix:** Change `label: 'Ask SANRO'` → `label: 'Ask Sanro AI'` in the nav links.

### Public site has no "Home" link in nav
**Cause:** `apps/web/app/(public)/layout.tsx` navLinks array didn't include Home.  
**Fix:** Add `{ href: '/', label: 'Home' }` as first item in `navLinks`.

### Login page has no way to go back to home
**Cause:** Auth layout had branding but no navigation.  
**Fix:** Add "Back to Home" link at top of login page:
```tsx
<Link href="/" className="inline-flex items-center gap-2 text-sm ...">
  <ArrowLeft className="h-4 w-4" /> Back to Home
</Link>
```

### Super admin has too many nav items (Learn, Assessments, Papers...)
**Cause:** Super admin shared nav config with teachers/institution admins.  
**Fix:** Separate nav arrays per role:
- Super Admin: Dashboard | Institutions | Students | Teachers | Settings
- Student: Dashboard | Learn | Assessments | Ask Sanro AI | Progress
- Teacher/Admin: Dashboard | Learn | Assessments | Papers | Remediation | Reports

---

## 5. API Response Field Mismatches

**Always verify frontend expects the same field names as backend returns.**

| Frontend expects | Backend returns | Status |
|---|---|---|
| `data.weakConcepts` | `weakContacts` | FIXED → `weakConcepts` |
| `profile.xpForLevel` | `xpToNext` | FIXED → `xpForLevel` |
| `profile.rank` | (not returned) | FIXED → now computed |

---

## 6. Seed Data Issues

### Student has too little data (0 mastery, 285 XP)
**Fix:** In `apps/api/prisma/seed.ts`, the `seedAchievements` function:
- Update gamification: `xp: 420, streakDays: 7`
- Add 6 achievements: FIRST_LOGIN, FIRST_ASSESSMENT, STREAK_3, STREAK_7, PRACTICE_PRO, SPEED_DEMON
- Seed 7 conceptMastery entries across grade 10 chapters

### Re-seeding after changes
```bash
pnpm --filter @sanro/api db:push    # sync schema
pnpm --filter @sanro/api db:seed    # re-seed data (idempotent)
```

---

## 7. Quick Reference Commands

```bash
# Typecheck
pnpm -r typecheck                    # All packages
pnpm --filter @sanro/api typecheck   # API only
pnpm --filter @sanro/web typecheck   # Web only

# Test
pnpm --filter @sanro/api test       # 18 tests

# Build
pnpm build                           # Full Turborepo build (6 tasks)

# Database
pnpm --filter @sanro/api db:push    # Sync schema to DB
pnpm --filter @sanro/api db:seed    # Seed demo data

# Deploy
git push https://ghp_TOKEN@github.com/sanroai/app.git master
# Railway: $env:RAILWAY_TOKEN="TOKEN"; railway up --service 590acd10-1017-419c-aa01-0bc828665f20
# Vercel: vercel --prod --yes --token TOKEN

# Dev servers
pnpm --filter @sanro/api start:dev  # API on :4000
pnpm --filter @sanro/web dev        # Web on :3000
```

---

## 8. File Locations Quick Reference

| What | Path |
|---|---|
| Dashboard layout (nav) | `apps/web/app/(dashboard)/layout.tsx` |
| Public layout (nav) | `apps/web/app/(public)/layout.tsx` |
| Login page | `apps/web/app/(auth)/login/page.tsx` |
| Forgot password | `apps/web/app/(auth)/forgot-password/page.tsx` |
| Gamification/Progress | `apps/web/app/(dashboard)/app/gamification/page.tsx` |
| Remediation (mastery cards) | `apps/web/app/(dashboard)/app/remediation/page.tsx` |
| Student dashboard | `apps/web/app/(dashboard)/app/page.tsx` |
| Institutions page | `apps/web/app/(dashboard)/app/institutions/page.tsx` |
| Curriculum page | `apps/web/app/(dashboard)/app/curriculum/page.tsx` |
| Learning home | `apps/web/app/(dashboard)/app/learn/page.tsx` |
| Role theme config | `packages/config/src/index.ts` |
| Role theme provider | `apps/web/lib/role-theme.tsx` |
| Gamification API | `apps/api/src/learning/learning.service.ts` (line 784) |
| Dashboard API | `apps/api/src/dashboard/dashboard.service.ts` |
| Auth (forgot pw) | `apps/api/src/auth/auth.service.ts` (line 305) |
| Seed data | `apps/api/prisma/seed.ts` |
| Prisma schema | `apps/api/prisma/schema.prisma` |
| Mobile login | `apps/mobile/app/(auth)/login.tsx` |
| Mobile forgot pw | `apps/mobile/app/(auth)/forgot-password.tsx` |
