'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ShieldX, AlertTriangle, GraduationCap, RefreshCw, LogOut, Mail } from 'lucide-react';
import { useAuthStore, accountState } from '@/lib/auth-store';
import { blockedStateFromCode, type BlockedState } from '@/lib/blocked-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GLOBAL_SUPPORT_EMAIL = 'support@sanroai.com';

const GUIDANCE: Partial<Record<BlockedState['state'], string>> = {
  SUBSCRIPTION_EXPIRED:
    'Your subscription has expired. Ask your institution\u2019s administrator to renew it to restore access.',
  INSTITUTION_SUSPENDED: 'This is controlled by your institution administrator.',
  INSTITUTION_ARCHIVED: 'This is controlled by your institution administrator.',
  INSTITUTION_PENDING: 'This is controlled by your institution administrator.',
  USER_DISABLED: 'Your account was disabled by an administrator.',
  MEMBERSHIP_DEACTIVATED: 'Your membership was deactivated by an administrator.',
};

const STATE_BADGE: Partial<Record<string, 'destructive' | 'warning' | 'secondary'>> = {
  SUBSCRIPTION_EXPIRED: 'destructive',
  INSTITUTION_SUSPENDED: 'destructive',
  INSTITUTION_ARCHIVED: 'secondary',
  INSTITUTION_PENDING: 'warning',
  USER_DISABLED: 'warning',
  MEMBERSHIP_DEACTIVATED: 'warning',
};

export default function AccountBlockedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramState = searchParams.get('state');
  const stored = useAuthStore((s) => s.blocked);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [retrying, setRetrying] = useState(false);

  const blocked: BlockedState | null = useMemo(
    () => stored ?? blockedStateFromCode(paramState),
    [stored, paramState],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!blocked) {
      router.replace('/login');
    }
  }, [hasHydrated, blocked, router]);

  if (!blocked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      const result = await accountState();
      if (result.access && !result.blocked) {
        router.replace('/app');
        return;
      }
    } finally {
      setRetrying(false);
    }
  }

  function handleSignOut() {
    clearSession();
    router.replace('/login');
  }

  const institution = blocked.institution ?? null;
  const supportContact = institution?.supportContact ?? GLOBAL_SUPPORT_EMAIL;
  const guidance = GUIDANCE[blocked.state];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface-50 to-white p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg mb-4">
            <ShieldX className="h-8 w-8 text-white" />
          </div>
          <div className="inline-flex items-center gap-2 text-surface-500">
            <GraduationCap className="h-5 w-5 text-brand-600" />
            <span className="text-lg font-bold text-surface-900">Sanro AI</span>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-sm font-medium tracking-wide text-surface-600 uppercase">
                Access restricted
              </span>
              <Badge variant={STATE_BADGE[blocked.state] ?? 'destructive'}>
                {blocked.state.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold text-surface-900 leading-tight">{blocked.title}</h1>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">{blocked.message}</p>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{guidance}</p>
            </div>

            {institution && (
              <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-50 p-5">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                  Institution
                </p>
                <p className="font-semibold text-surface-900">{institution.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-600">
                  <span>{institution.type.replace(/_/g, ' ').toLowerCase()}</span>
                  {institution.status && (
                    <Badge variant="secondary">{institution.status.replace(/_/g, ' ').toLowerCase()}</Badge>
                  )}
                  {institution.expiresAt && (
                    <span>
                      Expires{' '}
                      {new Date(institution.expiresAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <a
                  href={`mailto:${supportContact}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" />
                  {supportContact}
                </a>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
                disabled={retrying}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {retrying ? 'Checking...' : 'Retry'}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-surface-400">
              Contact your institution administrator or SANRO support at{' '}
              <Link
                href={`mailto:${GLOBAL_SUPPORT_EMAIL}`}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                {GLOBAL_SUPPORT_EMAIL}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}