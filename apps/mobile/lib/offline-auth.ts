import * as SecureStore from 'expo-secure-store';
import { sha256Hex } from './sha256';

const VAULT_KEY = 'sanro-offline-vault';

export interface CachedSessionPayload {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    institutionId: string;
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

export async function cacheSuccessfulLogin(
  email: string,
  password: string,
  session: CachedSessionPayload,
): Promise<void> {
  const vault = await readVault();
  vault[email.trim().toLowerCase()] = {
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(email, password),
    session,
    cachedAt: Date.now(),
  };
  await writeVault(vault);
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
  return entry.session;
}

export async function hasOfflineCredentials(email: string): Promise<boolean> {
  const vault = await readVault();
  return Boolean(vault[email.trim().toLowerCase()]);
}