import type { BlockedAccountResponse } from '@sanro/types';
import { BLOCKED_ACCOUNT_MESSAGES } from '@sanro/config';

export const BLOCKED_STATE_KEY = 'sanro-blocked';

export const BLOCKED_STATES = [
  'SUBSCRIPTION_EXPIRED',
  'INSTITUTION_SUSPENDED',
  'INSTITUTION_ARCHIVED',
  'INSTITUTION_PENDING',
  'USER_DISABLED',
  'MEMBERSHIP_DEACTIVATED',
] as const;

export type BlockedStateCode = (typeof BLOCKED_STATES)[number];

const BLOCKED_TITLES: Record<BlockedStateCode, string> = {
  SUBSCRIPTION_EXPIRED: "Your institution's subscription has expired",
  INSTITUTION_SUSPENDED: 'Institution access suspended',
  INSTITUTION_ARCHIVED: 'Institution access archived',
  INSTITUTION_PENDING: 'Institution pending activation',
  USER_DISABLED: 'Account disabled',
  MEMBERSHIP_DEACTIVATED: 'Membership deactivated',
};

export function isBlockedCode(code?: string | null): code is BlockedStateCode {
  return !!code && (BLOCKED_STATES as readonly string[]).includes(code);
}

export function blockedTitle(code: string): string {
  if (isBlockedCode(code)) return BLOCKED_TITLES[code];
  return 'Access unavailable';
}

export interface BlockedState extends BlockedAccountResponse {
  title: string;
}

export function toBlockedState(body: BlockedAccountResponse): BlockedState {
  return {
    ...body,
    title: blockedTitle(body.state),
    message: (BLOCKED_ACCOUNT_MESSAGES as Record<string, string>)[body.state] ?? body.message,
  };
}

export function blockedStateFromCode(code: string | null | undefined): BlockedState | null {
  if (!isBlockedCode(code)) return null;
  return {
    state: code,
    title: blockedTitle(code),
    message: BLOCKED_ACCOUNT_MESSAGES[code],
    institution: null,
  };
}

export function blockedRoute(state: Pick<BlockedState, 'state'>): string {
  return `/app/account-blocked?state=${encodeURIComponent(state.state)}`;
}

export function isBlockedResponseBody(body: unknown): body is BlockedAccountResponse {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return typeof b.state === 'string' && isBlockedCode(b.state) && !('accessToken' in b);
}