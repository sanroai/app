export const BLOCKED_STATES = [
  'SUBSCRIPTION_EXPIRED',
  'INSTITUTION_SUSPENDED',
  'INSTITUTION_ARCHIVED',
  'INSTITUTION_PENDING',
  'USER_DISABLED',
  'MEMBERSHIP_DEACTIVATED',
] as const;

export type BlockState = (typeof BLOCKED_STATES)[number];

export interface BlockedInstitution {
  id: string;
  name: string;
  type: string;
  status: string;
  expiresAt?: string | null;
  supportContact?: string | null;
}

export interface BlockedState {
  state: BlockState;
  message: string;
  institution?: BlockedInstitution | null;
}

export function isBlockedState(value: unknown): value is BlockState {
  return typeof value === 'string' && (BLOCKED_STATES as readonly string[]).includes(value);
}

export function isBlockedBody(b: unknown): boolean {
  if (!b || typeof b !== 'object') return false;
  const candidate = b as { state?: unknown; accessToken?: unknown };
  return isBlockedState(candidate.state) && candidate.accessToken == null;
}

export function isBlockedCode(code?: string): boolean {
  return isBlockedState(code);
}

export function blockedFromBody(b: unknown): BlockedState | null {
  if (!isBlockedBody(b)) return null;
  const candidate = b as {
    state: BlockState;
    message?: string;
    institution?: BlockedInstitution | null;
  };
  return {
    state: candidate.state,
    message: candidate.message ?? 'Access blocked',
    institution: candidate.institution ?? null,
  };
}

interface BlockedErrorLike {
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function blockedFromError(e: BlockedErrorLike): BlockedState | null {
  if (!e || !isBlockedCode(e.code)) return null;
  const details = e.details;
  const institutionName = details && typeof details.institutionName === 'string' ? details.institutionName : null;
  return {
    state: e.code as BlockState,
    message: e.message ?? 'Access blocked',
    institution:
      details && typeof details === 'object'
        ? {
            id: typeof details.institutionId === 'string' ? details.institutionId : '',
            name: institutionName ?? '',
            type: typeof details.institutionType === 'string' ? details.institutionType : '',
            status: typeof details.institutionStatus === 'string' ? details.institutionStatus : '',
            expiresAt:
              details.expiresAt && typeof details.expiresAt === 'string' ? details.expiresAt : null,
            supportContact:
              details.supportContact && typeof details.supportContact === 'string'
                ? details.supportContact
                : null,
          }
        : null,
  };
}

const BLOCKED_TITLES: Record<BlockState, string> = {
  SUBSCRIPTION_EXPIRED: 'Subscription Expired',
  INSTITUTION_SUSPENDED: 'Institution Suspended',
  INSTITUTION_ARCHIVED: 'Institution Archived',
  INSTITUTION_PENDING: 'Institution Pending',
  USER_DISABLED: 'Account Disabled',
  MEMBERSHIP_DEACTIVATED: 'Access Revoked',
};

export function blockedTitle(state: BlockState): string {
  return BLOCKED_TITLES[state];
}

export function routeForBlocked(state: BlockState): string {
  return `/expired?state=${encodeURIComponent(state)}`;
}