# SANRO AI — Mobile

## 1. Platform

Expo SDK 52 / React Native 0.76.5 / expo-router 4 / React 18.3.1. TypeScript
strict. Primary student experience (P0). Runtime is Expo — `@sanro/mobile#build`
is a turbo stub.

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