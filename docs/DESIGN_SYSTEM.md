# SANRO AI — Design System

## 1. Tokens

Central design tokens. Brand primary: violet/purple (#7c3aed → #8b5cf6).

Role themes:

| Role | Theme |
|---|---|
| Student | Violet, purple |
| Teacher | Blue / Indigo |
| Parent | Teal / Green |
| Principal | Deep Blue |
| Super Admin | Slate / Indigo |

Used for: primary actions, active navigation, cards, badges, charts, progress,
icons, subtle backgrounds. NOT a full recolor per role.

Semantic colors: success, warning, error, info, attention. Accessible contrast
(AA).

## 2. Typography

- Headings: Poppins
- Body: Inter
- Mono: JetBrains Mono (optional, code/data)
- Scales: generous, education-grade readability.

## 3. Surfaces & Effects

- Rounded cards (2xl / 3xl / 4xl), soft shadows (card, card-hover, elevated,
  glow), gradient accents, glass headers, subtle animations (float, shimmer,
  fade-in, slide-up, scale-in).

## 4. Components

shadcn/ui-style kit in `components/ui/`: button (variants incl. gradient,
success, warning; sizes incl. xl), card, badge, input (h-12 rounded-xl), label,
select, textarea, dialog, dropdown-menu, tabs, avatar, progress (gradient bar),
tooltip, separator, scroll-area. All Radix + cva based. No CSS-in-JS; Tailwind
utility classes.

## 5. Responsive & Touch

Desktop (1440/1280/1024) + mobile (390/430). Min touch target ≈44px. No
horizontal overflow, broken tables, off-screen buttons, overlapping modals.
Loading/empty/error/retry/success states on every async surface.

## 6. Icons

Lucide icon set on web; Ionicons on mobile; GraduationCap as the SANRO logo.