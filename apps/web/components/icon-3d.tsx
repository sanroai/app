import { ICONS, type IconKey } from '@/lib/subject-art';

/**
 * The premium 3D icon set (the same PNGs the mobile app bundles, served from
 * `/public/icons`). Web and mobile therefore show an identical icon for the same
 * concept - see docs/UX_REVAMP.md.
 *
 * Pass `name` for the keyed set, or `src` when the caller already resolved an
 * absolute path (subjects resolve their own icon through `subjectArt`).
 *
 * A plain `<img>` on purpose: these are 20 KB local PNGs, and `next/image` marked
 * them `loading="lazy"` inside the dashboard grid, where Chrome never issued the
 * request and the icons stayed blank until a scroll (verified with Playwright -
 * `complete: false`, no network entry). Eager local images are the honest fix.
 *
 * Decorative by default: every call site has adjacent text, so the image is
 * hidden from screen readers to avoid double announcements. Pass `label` when the
 * icon is the only carrier of meaning.
 */
export function Icon3D({
  name,
  src,
  size = 32,
  className,
  label,
}: {
  name?: IconKey;
  src?: string;
  size?: number;
  className?: string;
  label?: string;
}) {
  const resolved = src ?? (name ? ICONS[name] : null);
  if (!resolved) return null;
  return (
    <img
      src={resolved}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      loading="eager"
      decoding="async"
    />
  );
}
