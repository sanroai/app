# SANRO AI — Mobile

## 1. Platform

Expo SDK 53 / React Native 0.79.6 / expo-router / React 19.0.0 /
TypeScript ~5.8.3 (strict). Primary student experience (P0). Runtime is Expo —
`@sanro/mobile#build` is a turbo stub.

## 2. Navigation (role-aware)

Role-aware tab shell + stacked screens:

- Student tabs: Home / Library / Assessments / Ask Sanro AI / Me
  (`learn` tab retitled **Library**, `tests` tab retitled **Assessments**;
  the `practice` screen was removed — Practice is a concept mode)
- Teacher/admin tabs: Home / Classes / Assess / Me
- Parent tabs: Home / Children / Me
- Stacked: library browse (board→grade→subject), chapter, concept (6 modes),
  learning Path (inside Assessments), practice, quiz, flashcards, challenge,
  ask, attempt, leaderboard, profile-edit.

Wrong-role navigation is never shown. Lesson notes/descriptions render via
`components/Markdown.tsx`; YouTube lessons via `components/YouTubePlayer.tsx`
(react-native-webview iframe).

## 3. Concept Page Modes (student)

Learn · Practice · Quick Quiz · Flashcards · Challenge · Ask SANRO · AR/3D
(conditional). All question-driven flows hit the backend — no hardcoded
questions.

## 4. State & Storage

- TanStack Query 5 (staleTime 30 s, retry 1).
- Zustand for client state only.
- SecureStore keys: `sanro-token`, `sanro-refresh`, `sanro-user`,
  `sanro-memberships`.
- API base: `EXPO_PUBLIC_API_URL` (production builds:
  `https://api.sanroai.com/api/v1`).
- Offline mutation queue (Zustand + AsyncStorage), auto-flush on reconnect/
  app-active/interval. OfflineBanner communicates sync state.
- Offline login credential vault (SecureStore + SHA-256, salted `sanro-offline`).

## 5. Assessment Resilience

- Draft AutoSave: AsyncStorage `sanro-attempt-draft:<id>`, save every 15 s +
  on unmount.
- Submit offline → "Saved offline — will sync".
- Duplicate-submit guard on server; client `finishedRef` guard for challenge.

## 6. AR

WebView hosting Google `<model-viewer>` 3.5.0 (unpkg). Graces to 3D fallback;
capability detection via native module presence.

## 7. Config

- `app.json`: com.sanro.ai, version + versionCode managed, portrait, newArch,
  Hermes, splash #7c3aed.
- `eas.json`: development / preview (APK) / production (AAB), prod API URL in
  all profiles.
- Metro watches monorepo root; tsconfig has strict + paths.

## 8. Build & Release

- `pnpm --filter @sanro/mobile typecheck` — mobile typecheck
- `expo run:android` / EAS for APK/AAB
- Release APK staged at `releases/sanroai.apk` → published to
  `https://sanroai.com/downloads/sanroai.apk` via `scripts/publish-apk.mjs`
  (ZIP magic + ≥5 MB validation).

## 9. Design system (3D icons & pastel cards)

Warm, playful visual language aligned to the product references (3D "clay"
iconography, pastel subject cards, cream canvas) rather than flat vector icons.

- **Canvas**: `Colors.background` is warm cream `#faf7f2`; text is warm near-
  black `#1c1917`. Cards are white on cream with soft shadows.
- **`Pastel` / `Ink` token pairs** in `constants/theme.ts` — a soft background
  plus a matching high-contrast foreground (e.g. `Pastel.mint` / `Ink.mint`) so
  tinted surfaces never carry illegible text.
- **3D icon assets** — 34 Microsoft Fluent Emoji 3D PNGs in
  `assets/icons/` (~1 MB), the exact glossy/clay style of the reference boards.
  Sourced from `microsoft/fluentui-emoji` via jsDelivr; MIT licensed.
- **`components/Icon3D.tsx`** — static `require()` asset map with a typed
  `Icon3DName` union and `hasIcon3D()` guard. Never throws on a missing name;
  renders nothing so callers can degrade.
- **`components/visuals.tsx`** — the reusable primitives:
  - `resolveSubject(name)` maps a subject name to a `{icon, bg, ink}` triple by
    keyword, so Science → microscope/mint, Mathematics → abacus/violet,
    English → speech-balloon/peach, Hindi → open-book/rose, Social Science →
    books/sky. Fallback is a generic bookshelf/lavender.
  - `resolveAchievement(icon, index)` maps the API's achievement `icon`
    strings to 3D assets, cycling pastel tints by index.
  - `<SubjectCard>` pastel grid tile, `<StatTile>` icon+value+label stat,
    `<SectionHeader>`, `<ProgressBar>`, `<Chevron>`.

**Contrast rule adopted from the audit:** status/score chips rendered on a
coloured header must use a *solid* surface (white) with a status dot and a
dark foreground — never a low-opacity tint of the status colour over the
header, which reads as mud. See the concept-page mastery chip.

### API contract notes (client must match these shapes)

The mobile client previously declared flat shapes that the API never returned,
which silently rendered 0 XP / 0 streak / `NaN%`. The authoritative shapes:

- `GET /learning/gamification/profile` → flat
  `{ xp, level, xpInLevel, xpForLevel, rank, streakDays, achievementCount,
  recentAchievements[] }` (no `profile` wrapper, no `userId`).
- `GET /learning/gamification/achievements` → `{ earned[], locked[] }`
  (not `{ achievements[] }`).
- `GET /learning/progress` → nested
  `{ student, contentProgress{totalContent,completedContent,percentComplete},
  mastery{averageScore,totalConcepts,byLevel}, recentActivity[] }`
  (not flat).
- `GET /learning/gamification/leaderboard` → `{ entries[{userId,name,xp,
  level,streakDays,rank}], myRank, period }`. The "me" highlight resolves from
  the auth store's `user.id`, since the profile response carries no `userId`.