export interface VideoSegment {
  title: string;
  startSeconds: number;
  /** Derived from the chapter's concepts because the video has no creator chapters. */
  derived?: boolean;
}

export function formatTimestamp(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function normalizeSegments(raw: unknown): VideoSegment[] {
  if (!Array.isArray(raw)) return [];
  const byStart = new Map<number, VideoSegment>();
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    const start = record.startSeconds;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) continue;
    const startSeconds = Math.floor(start);
    if (byStart.has(startSeconds)) continue;
    const title =
      typeof record.title === 'string' && record.title.trim()
        ? record.title.trim()
        : `Marker at ${formatTimestamp(startSeconds)}`;
    byStart.set(startSeconds, { title, startSeconds, derived: record.derived === true });
  }
  return [...byStart.values()].sort((a, b) => a.startSeconds - b.startSeconds);
}
