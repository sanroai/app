export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  userId?: string;
  me?: boolean;
}

export const PODIUM_ORDER = [2, 1, 3];

export const PODIUM_HEIGHT: Record<number, number> = { 1: 96, 2: 72, 3: 56 };

export const PODIUM_COLOR: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' };

export interface PodiumSlot {
  rank: number;
  entry: LeaderboardEntry | null;
  height: number;
  color: string;
}

export function buildPodium(entries: LeaderboardEntry[]): PodiumSlot[] {
  if (entries.length < 3) return [];
  return PODIUM_ORDER.map((rank) => {
    const entry = entries.find((e) => e.rank === rank) ?? null;
    return { rank, entry, height: PODIUM_HEIGHT[rank], color: PODIUM_COLOR[rank] };
  });
}
