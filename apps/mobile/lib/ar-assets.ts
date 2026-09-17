const WEB_BASE = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://sanroai.com';

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${WEB_BASE.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
}
