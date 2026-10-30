'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore, accountState } from '@/lib/auth-store';
import { blockedRoute } from '@/lib/blocked-state';
import { useRoleTheme, useRole } from '@/lib/role-theme';
import {
  LogOut,
  GraduationCap,
  Settings,
  Search,
  Menu,
  X,
  UserCircle2,
  ShieldX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notification-bell';
import { Icon3D } from '@/components/icon-3d';
import { PrefetchLink } from '@/components/prefetch-link';
import { prefetchLearningHome, prefetchLearningPath, prefetchLibraryBrowse } from '@/lib/prefetch';
import { useQueryClient } from '@tanstack/react-query';
import { ICONS, type IconKey } from '@/lib/subject-art';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  INSTITUTION_ADMIN: 'Institution Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'from-slate-600 to-indigo-600',
  INSTITUTION_ADMIN: 'from-blue-700 to-indigo-700',
  TEACHER: 'from-indigo-600 to-blue-600',
  STUDENT: 'from-violet-600 to-purple-600',
  PARENT: 'from-teal-600 to-emerald-600',
};

function isActive(pathname: string, href: string) {
  if (href === '/app') return pathname === '/app' || pathname === '/app/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Every navigation item carries a premium 3D icon (`art`) from the shared set;
 * `icon` is only a fallback for items added later that have no artwork yet.
 * The user rejected both emoji and the flat lucide glyphs in the menu, so the
 * menu is the one place where the 3D set is mandatory rather than decorative.
 */
type NavLink = { href: string; label: string; art: IconKey; icon?: LucideIcon; alias?: string[] };

function NavIcon({ link, size, className }: { link: NavLink; size: number; className?: string }) {
  if (link.art) return <Icon3D src={ICONS[link.art]} size={size} className={cn('shrink-0', className)} />;
  const Icon = link.icon;
  if (!Icon) return null;
  return <Icon className={cn('shrink-0', className)} style={{ width: size, height: size }} />;
}

function NavLinks({ role, mobile = false, onNavigate }: { role: string; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useRoleTheme();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'INSTITUTION_ADMIN';
  const staff = role === 'TEACHER' || isAdmin || isSuperAdmin;

  const activeClass = `bg-gradient-to-r ${theme.gradient} text-white shadow-md`;

  /**
   * The top-level nav is the first click of every session, so hovering it warms
   * both the route (chunk/compile) and the screen's data. Anything that is not a
   * known expensive screen simply gets the route prefetch from PrefetchLink.
   */
  const warmFor = (href: string): (() => void) | undefined => {
    if (href === '/app/library') {
      return () => {
        prefetchLibraryBrowse(queryClient, token);
        prefetchLearningHome(queryClient, token);
      };
    }
    if (href === '/app/assessments') return () => prefetchLearningPath(queryClient, token);
    return undefined;
  };

  const superAdminLinks: NavLink[] = isSuperAdmin
    ? [
        { href: '/app', label: 'Dashboard', art: 'glowingStar' },
        { href: '/app/institutions', label: 'Institutions', art: 'graduationCap' },
      ]
    : [];

  const studentLinks: NavLink[] = role === 'STUDENT'
    ? [
        { href: '/app', label: 'Dashboard', art: 'glowingStar' },
        { href: '/app/library', label: 'Library', art: 'bookshelf', alias: ['/app/learn'] },
        { href: '/app/assessments', label: 'Assessments', art: 'clipboard' },
        { href: '/app/chat', label: 'Ask Sanro AI', art: 'speechBalloon' },
        { href: '/app/gamification', label: 'Progress', art: 'trophy' },
      ]
    : [];

  const parentLinks: NavLink[] = role === 'PARENT'
    ? [
        { href: '/app', label: 'Dashboard', art: 'glowingStar' },
        { href: '/app/children', label: 'Children', art: 'crayon' },
      ]
    : [];

  const staffLinks: NavLink[] = staff && !isSuperAdmin
    ? [
        { href: '/app', label: 'Dashboard', art: 'glowingStar' },
        { href: '/app/library', label: 'Library', art: 'bookshelf' },
      ]
    : [];

  const primaryLinks = isSuperAdmin ? superAdminLinks : role === 'STUDENT' ? studentLinks : role === 'PARENT' ? parentLinks : staffLinks;

  const peopleLinks: NavLink[] = isSuperAdmin
    ? [
        { href: '/app/people/students', label: 'Students', art: 'graduationCap' },
        { href: '/app/people/teachers', label: 'Teachers', art: 'pencil' },
        { href: '/app/people/parents', label: 'Parents', art: 'wavingHand' },
      ]
    : [];

  const managementLinks: NavLink[] = staff && !isSuperAdmin
    ? [
        { href: '/app/students', label: 'Students', art: 'graduationCap' },
        { href: '/app/teachers', label: 'Teachers', art: 'pencil' },
        { href: '/app/parents', label: 'Parents', art: 'wavingHand' },
        ...(isAdmin ? [{ href: '/app/import', label: 'Import', art: 'rocket' as IconKey }] : []),
      ]
    : [];

  const peopleDropdownLinks = isSuperAdmin ? peopleLinks : managementLinks;

  const academicLinks: NavLink[] = staff
    ? [
        // Curriculum is a SUPER_ADMIN management console (the page calls
        // GET /admin/curriculum, @Roles(SUPER_ADMIN) only) — gating the nav link to the
        // same role prevents TEACHER/IA from hitting a 403 error banner. See BUG-I.
        ...(isSuperAdmin ? [{ href: '/app/curriculum', label: 'Curriculum', art: 'book' as IconKey }] : []),
        { href: '/app/questions', label: 'Question Bank', art: 'magnifier' },
        { href: '/app/papers', label: 'Question Papers', art: 'pencil' },
        ...(isSuperAdmin ? [{ href: '/app/content-processing', label: 'Content', art: 'bookshelf' as IconKey }] : []),
        ...(!isSuperAdmin ? [{ href: '/app/papers/new', label: 'New Paper', art: 'pencil' as IconKey }] : []),
        { href: '/app/content/ingest', label: 'Content Ingest', art: 'openBook' },
        { href: '/app/content/videos', label: 'Chapter Videos', art: 'palette' },
        { href: '/app/ar', label: 'AR / 3D', art: 'rocket' },
      ]
    : [];

  const analyticsLinks: NavLink[] = staff
    ? [
        { href: '/app/reports', label: 'Reports', art: 'chart' },
        ...(isSuperAdmin ? [{ href: '/app/gamification', label: 'Gamification', art: 'trophy' as IconKey }] : []),
        ...(staff && !isSuperAdmin ? [{ href: '/app/remediation', label: 'Remediation', art: 'lightbulb' as IconKey }] : []),
      ]
    : [];

  const settingsLinks: NavLink[] = [
    { href: '/app/settings', label: 'Settings', art: 'puzzle' },
  ];

  const activeFor = (l: NavLink) =>
    isActive(pathname, l.href) || (l.alias ?? []).some((a) => isActive(pathname, a));

  const renderLink = (l: NavLink) => {
    const active = activeFor(l);
    return (
      <PrefetchLink
        key={l.href}
        href={l.href}
        prefetchData={warmFor(l.href)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          active
            ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
            : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
        )}
      >
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors',
            active ? 'bg-white/20' : 'bg-surface-100'
          )}
        >
          <NavIcon link={l} size={24} />
        </span>
        {l.label}
      </PrefetchLink>
    );
  };

  const renderDropdown = (label: string, art: IconKey, links: NavLink[]) => {
    const active = links.some((l) => activeFor(l));
    return (
      <DropdownMenu key={label}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors',
                active ? 'bg-white/20' : 'bg-surface-100'
              )}
            >
              <Icon3D src={ICONS[art]} size={24} className="shrink-0" />
            </span>
            {label}
            <svg className="h-3 w-3 text-current opacity-70" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {links.map((l) => (
            <DropdownMenuItem key={l.href} asChild>
              <Link href={l.href} className="flex items-center gap-2.5 py-1">
                <NavIcon link={l} size={24} />
                {l.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderMobileLink = (l: NavLink) => {
    const active = activeFor(l);
    return (
      <PrefetchLink
        key={l.href}
        href={l.href}
        prefetchData={warmFor(l.href)}
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate?.()}
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
          active
            ? activeClass
            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
        )}
      >
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
            active ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-800'
          )}
        >
          <NavIcon link={l} size={26} />
        </span>
        {l.label}
      </PrefetchLink>
    );
  };

  if (mobile) {
    const sections = [
      { label: 'People', links: peopleDropdownLinks },
      { label: 'Academic', links: academicLinks },
      ...(staff ? [{ label: 'Assessments', links: [{ href: '/app/assessments', label: 'Assessments', art: 'clipboard' as IconKey }] as NavLink[] }] : []),
      { label: 'Analytics', links: analyticsLinks },
      { label: 'Settings', links: settingsLinks },
    ];
    return (
      <div className="flex flex-col gap-1 p-2">
        {primaryLinks.map(renderMobileLink)}
        {sections
          .filter((s) => s.links.length > 0)
          .map((s) => (
            <div key={s.label}>
              <div className="mx-4 my-2 border-t border-surface-100 dark:border-surface-800" />
              <p className="mx-4 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase">{s.label}</p>
              {s.links.map(renderMobileLink)}
            </div>
          ))}
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Main navigation">
      {primaryLinks.map(renderLink)}
      {peopleDropdownLinks.length > 0 && (
        <>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
          {renderDropdown('People', 'wavingHand', peopleDropdownLinks)}
        </>
      )}
      {academicLinks.length > 0 && (
        <>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
          {renderDropdown('Academic', 'book', academicLinks)}
        </>
      )}
      {staff && (
        <>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
          {renderLink({ href: '/app/assessments', label: 'Assessments', art: 'clipboard' })}
        </>
      )}
      {analyticsLinks.length > 0 && (
        <>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
          {renderDropdown('Analytics', 'chart', analyticsLinks)}
        </>
      )}
      {settingsLinks.length > 0 && (
        <>
          <div className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" aria-hidden="true" />
          {renderDropdown('Settings', 'puzzle', settingsLinks)}
        </>
      )}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, blocked, clearSession } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBlockedBanner, setShowBlockedBanner] = useState(true);
  const theme = useRoleTheme();
  const role = useRole();

  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accountCheckDone = useRef(false);

  const isBlockedRoute = pathname?.startsWith('/app/account-blocked') ?? false;

  useEffect(() => {
    if (!hasHydrated) return;
    if (blocked) {
      if (!isBlockedRoute) router.replace(blockedRoute(blocked));
      return;
    }
    if (!token) {
      if (!isBlockedRoute) router.replace('/login');
      return;
    }
    if (isBlockedRoute || accountCheckDone.current) return;
    accountCheckDone.current = true;
    void accountState().then((r) => {
      if (r.access === false && r.blocked) router.replace(blockedRoute(r.blocked));
    });
  }, [hasHydrated, token, blocked, isBlockedRoute, router]);

  if (!hasHydrated) return null;

  if (isBlockedRoute) {
    return <>{children}</>;
  }

  if (!user || !token) return null;

  function handleLogout() {
    clearSession();
    router.replace('/login');
  }

  const initials = (user.name?.trim() || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">Skip to content</a>
      {/* Blocked account banner */}
      {blocked && showBlockedBanner && (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 dark:bg-amber-950/80 dark:border-amber-800">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
            <ShieldX className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-amber-900 dark:text-amber-100">
              Access restricted &mdash; your account is blocked.
            </p>
            <Link
              href="/app/account-blocked"
              className="shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300"
            >
              View details
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setShowBlockedBanner(false)}
              className="shrink-0 rounded-lg p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/app" className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient}`}>
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-surface-900 dark:text-surface-100 hidden sm:block">Sanro AI</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-surface-100 dark:bg-surface-800 px-4 py-2">
              <Search className="h-4 w-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search students, concepts..."
                aria-label="Search students, concepts"
                className="bg-transparent text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all" aria-label="User menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={cn("bg-gradient-to-br text-white text-sm font-semibold", ROLE_COLORS[user.role])}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-surface-900 dark:text-surface-100">{user.name}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">{ROLE_LABELS[user.role]}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex items-center">
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user.role !== 'STUDENT' && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle navigation menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:block border-t border-surface-100 dark:border-surface-800 bg-white/50 dark:bg-surface-950/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
            <NavLinks role={user.role} />
          </div>
        </div>
      </header>

      {/* Mobile Nav — hidden for students (they use bottom tabs) */}
      {user.role !== 'STUDENT' && mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 shadow-lg"
          >
            <NavLinks role={user.role} mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <main id="main-content" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8">
        {children}
      </main>
    </div>
  );
}