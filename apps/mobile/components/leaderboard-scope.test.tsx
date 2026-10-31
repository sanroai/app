import {
  buildScopeChips,
  scopeChipToGroupId,
  SCHOOL_SCOPE_KEY,
  type LeaderboardScopeGroup,
} from './leaderboard-scope';

const groups: LeaderboardScopeGroup[] = [
  { id: 'g-1', name: 'Class 10 - A', grade: '10' },
  { id: 'g-2', name: 'Class 10 - B', grade: '10' },
];

describe('buildScopeChips (mobile leaderboard scope selector)', () => {
  it('always offers the whole-school board first', () => {
    const chips = buildScopeChips([], null);
    expect(chips).toHaveLength(1);
    expect(chips[0].key).toBe(SCHOOL_SCOPE_KEY);
    expect(chips[0].label).toBe('Whole school');
  });

  it('adds one chip per class the caller may see', () => {
    const chips = buildScopeChips(groups, null);
    expect(chips.map((c) => c.label)).toEqual(['Whole school', 'Class 10 - A', 'Class 10 - B']);
  });

  it('marks the whole-school chip active when no class is selected', () => {
    const chips = buildScopeChips(groups, null);
    expect(chips.filter((c) => c.active)).toHaveLength(1);
    expect(chips[0].active).toBe(true);
  });

  it('marks the selected class active instead of the whole-school chip', () => {
    const chips = buildScopeChips(groups, 'g-2');
    const active = chips.filter((c) => c.active);
    expect(active).toHaveLength(1);
    expect(active[0].key).toBe('g-2');
    expect(active[0].label).toBe('Class 10 - B');
  });

  it('falls back to the whole-school chip for a group id that is not offered', () => {
    const chips = buildScopeChips(groups, 'g-unknown');
    expect(chips.every((c) => !c.active)).toBe(true);
  });

  it('maps the school chip back to no class filter', () => {
    expect(scopeChipToGroupId(SCHOOL_SCOPE_KEY)).toBeNull();
    expect(scopeChipToGroupId('g-1')).toBe('g-1');
  });
});
