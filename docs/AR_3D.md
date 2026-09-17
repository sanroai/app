# SANRO AI — AR/3D

## 1. Position

AR is an educational modality mapped to concepts — not the product itself.
Used for spatial visualization: heart, cell, atom, molecules, solar system,
respiratory/digestive systems, Earth, geometric solids, 3D math.

## 2. Models

- Formats: GLB / GLTF / USDZ (validated: magic bytes, JSON chunk, glTF inspect,
  USDZ container).
- Size caps: model ≤ 50 MB, preview image ≤ 5 MB.
- Signed storage URLs; expired URL fallback to local/public path.
- Assets stored at `apps/web/public/models/*.glb` (seed) + R2 for uploads.

## 3. Viewer

- 3D viewer (rotate / zoom / reset) + AR where the device supports it via
  `model-viewer`.
- No AR support → 3D fallback. Camera denied/unavailable → 3D fallback.
- No model → modality hidden or clear unavailable state. Never fake AR.
- Hotspots, labels, guided exploration, quick check (real question bank).

## 4. Lifecycle

DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED with publish guards
(validation must pass before publish).

## 5. Student Tracking

`/ar/:id/activity` records interactions; `/ar/my-activity` for student. AR
activity contributes to learning analytics, not fake mastery.

## 6. Failure Handling

huge model, corrupt model, missing texture, low memory, offline, interrupted
download — all degrade to informative retry/fallback UI (both web and mobile
WebView viewer).