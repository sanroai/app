export function titleCase(s: string): string {
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDate(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDurationMinutes(minutes?: number | null): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function formatScore(score?: number | null, max?: number | null): string {
  if (score === undefined || score === null) return '—';
  if (max) return `${score}/${max}`;
  return String(score);
}

export function accuracyPct(accuracy?: number | null): string {
  if (accuracy === undefined || accuracy === null) return '—';
  return `${accuracy}%`;
}