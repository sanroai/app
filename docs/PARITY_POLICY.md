# Web <-> Mobile parity policy (decided 2026-10-22)

**Status:** DECIDED
**Why:** the product owner asked for the web dashboard and the mobile app to have "all the same
things, in sync". Without a rule for what must match, that becomes an endless chase - so the
rule is written down here and enforced by the parity sweep.

---

## 1. The rule

**Every student-facing capability exists on BOTH platforms, with the same behaviour and the
same numbers.** If a student can do it on the phone, they can do it on the web, and the two
show the same data.

**Authoring and administration stay web-only.** A teacher does not edit a paper on a phone;
that is a deliberate scope decision, not a gap.

| Layer | Web | Mobile | Rule |
|---|---|---|---|
| Learning (library, chapters, concepts, practice, flashcards, assessments, attempts) | yes | yes | **must be identical** |
| Gamification (XP, streak, mastery, achievements, leaderboard + its scope/period switch) | yes | yes | **must be identical** |
| Progress and diagnosis (learning path, remediation, reports) | yes | yes | **must be identical** |
| AI (chat for a concept / a chapter) | yes | yes | **must be identical** |
| Account (profile, edit, children for a parent, blocked/expired session) | yes | yes | **must be identical** |
| Authoring (papers, questions, curriculum, imports, institutions, content management) | yes | no | web-only by design |
| Administration (staff dashboards, AR management, reports across the school) | yes | no | web-only by design |

## 2. What "identical" means concretely

- the same **API endpoint** feeds both (never a second, mobile-only endpoint);
- the same **fields** are shown (a stat on the phone has the same number as on the web);
- the same **empty, loading and error states** (a screen that hangs on one platform is a bug on both);
- the same **navigation outcome** (the same concept opens the same way);
- the same **gamification rules** (XP amounts, the streak rule, the leaderboard window) - the
  API is the single source, so a difference is a client bug.

## 3. The parity table (living document)

Keep this table current. It is the acceptance checklist for a release.

| Capability | Web | Mobile |
|---|---|---|
| Home (focus, streak, XP, mastery, continue, pending) | `app/(dashboard)/app/page.tsx` | `app/(tabs)/index.tsx` |
| Library browse | `app/(dashboard)/app/library/**` | `app/(tabs)/learn.tsx`, `app/learn/**` |
| Chapter hub | `app/(dashboard)/app/learn/chapters/[chapterId]` | `app/chapter/[chapterId]` (the old `app/learn/chapter/[chapterId]` redirects to it) |
| Concept (Learn / Practice / Ask) | `app/(dashboard)/app/learn/concepts/[conceptId]` | `app/concept/[conceptId]` |
| Practice session | `app/(dashboard)/app/learn/practice/[practiceId]` | `app/practice/[practiceId]` |
| Flashcards | `app/(dashboard)/app/flashcards/[conceptId]` (also a format inside the concept page) | `app/flashcards/[conceptId]` |
| Assessment list | `app/(dashboard)/app/assessments` | `app/(tabs)/assessments.tsx` |
| Learning path | `app/(dashboard)/app/assessments` (path tab) | `app/(tabs)/tests.tsx` |
| Assessment attempt | `app/(dashboard)/app/assessments/attempt/[attemptId]` | `app/attempt/[attemptId]` |
| Remediation (what to fix) | `app/(dashboard)/app/remediation` | `app/remediation` |
| Progress / reports | `app/(dashboard)/app/gamification`, `app/(dashboard)/app/profile` (learning progress), `app/(dashboard)/app/reports` | `app/(tabs)/me.tsx` (learning progress) |
| Gamification overview | `app/(dashboard)/app/gamification` | `app/(tabs)/me.tsx` |
| Achievements | `app/(dashboard)/app/gamification/achievements` | `app/(tabs)/me.tsx` |
| Leaderboard (+ scope + period) | `app/(dashboard)/app/gamification/leaderboard` | `app/leaderboard.tsx` |
| AI chat | `app/(dashboard)/app/chat` | `app/ask/[conceptId]`, `app/(tabs)/ask.tsx` |
| Profile / edit | `app/(dashboard)/app/profile` | `app/(tabs)/me.tsx`, `app/profile-edit.tsx` |
| Parent: children | `app/(dashboard)/app/children` | `app/(tabs)/children.tsx` |
| Teacher: classes | `app/(dashboard)/app/students`, `teachers`, `parents` | `app/(tabs)/classes.tsx` |

## 4. How parity is kept from drifting

1. **One API** - both clients call the same endpoints; a missing capability is an API gap,
   not a mobile gap.
2. **The parity sweep** - a scripted comparison of the route/feature lists, run before a
   release, flags anything present on one side only.
3. **A test per capability** where it matters (the mode list, the scope switch, the XP
   amounts) so a behavioural difference fails a test rather than a review.
4. **New features land on both** in the same change, or the table above is updated with the
   reason they are intentionally different.

## 5. Known, accepted differences

- the mobile app has no authoring or administration screens (by design, see the table);
- the mobile app opens the textbook PDF in the system browser (the web embeds it in a
  dialog) - the same file, a different viewer;
- the mobile tab shell is 5 tabs, the web is a sidebar - the same destinations, grouped
  differently for a phone.
