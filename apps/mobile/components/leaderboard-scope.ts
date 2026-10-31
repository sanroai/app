export interface LeaderboardScopeGroup {
  id: string;
  name: string;
  grade?: string | null;
}

export interface ScopeChip {
  /** 'school' for the whole-school chip, otherwise the group id */
  key: string;
  label: string;
  active: boolean;
}

export const SCHOOL_SCOPE_KEY = 'school';

/**
 * The scope selector of the leaderboard: whole school plus every class the caller is
 * allowed to see. The API returns those permitted scopes inline, so the screen never
 * has to ask for them separately.
 */
export function buildScopeChips(
  groups: LeaderboardScopeGroup[],
  selectedGroupId: string | null | undefined,
): ScopeChip[] {
  const chips: ScopeChip[] = [
    { key: SCHOOL_SCOPE_KEY, label: 'Whole school', active: !selectedGroupId },
  ];
  for (const group of groups) {
    chips.push({ key: group.id, label: group.name, active: selectedGroupId === group.id });
  }
  return chips;
}

/** The group id a chip selects, or null for the whole-school board. */
export function scopeChipToGroupId(key: string): string | null {
  return key === SCHOOL_SCOPE_KEY ? null : key;
}
