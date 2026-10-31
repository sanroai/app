import { buildPodium, PODIUM_COLOR, PODIUM_HEIGHT, PODIUM_ORDER, type LeaderboardEntry } from './leaderboard-podium';

const entries: LeaderboardEntry[] = [
  { rank: 1, name: 'Aarav Sharma', xp: 420 },
  { rank: 2, name: 'Priya Sharma', xp: 260 },
  { rank: 3, name: 'Rohan Verma', xp: 120 },
];

describe('buildPodium (mobile leaderboard 3D podium)', () => {
  it('hides the podium when there are fewer than three learners', () => {
    expect(buildPodium([])).toEqual([]);
    expect(buildPodium(entries.slice(0, 2))).toEqual([]);
  });

  it('lays the slots out as 2 - 1 - 3 so the winner stands in the middle', () => {
    const podium = buildPodium(entries);
    expect(podium.map((s) => s.rank)).toEqual([2, 1, 3]);
    expect(podium.map((s) => s.entry?.name)).toEqual(['Priya Sharma', 'Aarav Sharma', 'Rohan Verma']);
  });

  it('gives the winner the tallest block and the third place the shortest', () => {
    const podium = buildPodium(entries);
    const height = (rank: number) => podium.find((s) => s.rank === rank)?.height ?? 0;
    expect(height(1)).toBeGreaterThan(height(2));
    expect(height(2)).toBeGreaterThan(height(3));
    expect(height(1)).toBe(PODIUM_HEIGHT[1]);
  });

  it('uses a distinct medal colour per rank', () => {
    const podium = buildPodium(entries);
    const colors = podium.map((s) => s.color);
    expect(new Set(colors).size).toBe(3);
    expect(colors).toEqual(PODIUM_ORDER.map((rank) => PODIUM_COLOR[rank]));
  });

  it('leaves a slot empty when a rank is missing from the data', () => {
    const podium = buildPodium([entries[0], entries[1], { rank: 4, name: 'Fourth', xp: 10 }]);
    expect(podium.find((s) => s.rank === 3)?.entry).toBeNull();
    expect(podium.find((s) => s.rank === 1)?.entry?.name).toBe('Aarav Sharma');
  });

  it('keeps the podium order stable regardless of the incoming row order', () => {
    const podium = buildPodium([...entries].reverse());
    expect(podium.map((s) => s.entry?.name)).toEqual(['Priya Sharma', 'Aarav Sharma', 'Rohan Verma']);
  });
});
