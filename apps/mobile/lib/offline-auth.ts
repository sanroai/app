import * as SecureStore from 'expo-secure-store';
import { sha256Hex } from './sha256';
import { BlockState } from './blocked';

const VAULT_KEY = 'sanro-offline-vault';
const ENTITLEMENT_KEY = 'sanro-entitlement';

export interface CachedEntitlement {
  state: 'ok' | 'expired';
  expiresAt: string | null;
  message?: string;
  blockState?: BlockState;
}

export class OfflineEntitlementError extends Error {
  readonly blockState: BlockState;

  constructor(blockState: BlockState, message = 'Your account is blocked. Offline access is paused until the account is reactivated.') {
    super(message);
    this.name = 'OfflineEntitlementError';
    this.blockState = blockState;
  }
}

export interface CachedSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    institutionId: string | null;
    isActive: boolean;
    isSuperAdmin: boolean;
  };
  memberships: Array<{
    id: string;
    role: string;
    institution: { id: string; name: string; type: string };
    status: string;
  }>;
}

interface VaultEntry {
  email: string;
  passwordHash: string;
  session: CachedSessionPayload | null;
  cachedAt: number;
}

type Vault = Record<string, VaultEntry>;

async function readVault(): Promise<Vault> {
  const raw = await SecureStore.getItemAsync(VAULT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Vault;
  } catch {
    return {};
  }
}

async function writeVault(vault: Vault): Promise<void> {
  await SecureStore.setItemAsync(VAULT_KEY, JSON.stringify(vault));
}

function hashPassword(email: string, password: string): string {
  return sha256Hex(`${email.trim().toLowerCase()}|sanro-offline|${password}`);
}

let entitlementCache: CachedEntitlement | null = null;

export async function hydrateCachedEntitlement(): Promise<CachedEntitlement | null> {
  entitlementCache = await getCachedEntitlement();
  return entitlementCache;
}

export async function getCachedEntitlement(): Promise<CachedEntitlement | null> {
  const raw = await SecureStore.getItemAsync(ENTITLEMENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedEntitlement;
  } catch {
    return null;
  }
}

export function getCachedEntitlementSync(): CachedEntitlement | null {
  return entitlementCache;
}

export async function setCachedEntitlement(entitlement: CachedEntitlement | null): Promise<void> {
  entitlementCache = entitlement;
  if (entitlement) {
    await SecureStore.setItemAsync(ENTITLEMENT_KEY, JSON.stringify(entitlement));
  } else {
    await SecureStore.deleteItemAsync(ENTITLEMENT_KEY);
  }
}

export function isCachedEntitlementExpiredSync(entitlement?: CachedEntitlement | null): boolean {
  const ent = entitlement ?? entitlementCache;
  if (!ent || ent.state !== 'expired') return false;
  if (!ent.expiresAt) return true;
  const expiresAt = Date.parse(ent.expiresAt);
  if (isNaN(expiresAt)) return true;
  return expiresAt <= Date.now();
}

export async function cacheSuccessfulLogin(
  email: string,
  password: string,
  session: CachedSessionPayload,
  entitlement?: CachedEntitlement,
): Promise<void> {
  const vault = await readVault();
  vault[email.trim().toLowerCase()] = {
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(email, password),
    session,
    cachedAt: Date.now(),
  };
  await writeVault(vault);
  if (entitlement) {
    await setCachedEntitlement(entitlement);
  } else if (!isCachedEntitlementExpiredSync()) {
    await setCachedEntitlement({ state: 'ok', expiresAt: null });
  }
}

export async function verifyOfflineLogin(
  email: string,
  password: string,
): Promise<CachedSessionPayload | null> {
  const key = email.trim().toLowerCase();
  const vault = await readVault();
  const entry = vault[key];
  if (!entry) return null;
  if (entry.passwordHash !== hashPassword(email, password)) return null;
  const entitlement = entitlementCache ?? (await getCachedEntitlement());
  if (isCachedEntitlementExpiredSync(entitlement)) {
    throw new OfflineEntitlementError(
      entitlement?.blockState ?? 'SUBSCRIPTION_EXPIRED',
      entitlement?.message,
    );
  }
  return entry.session;
}

export async function hasOfflineCredentials(email: string): Promise<boolean> {
  const vault = await readVault();
  return Boolean(vault[email.trim().toLowerCase()]);
}