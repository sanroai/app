'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore, accountState } from '@/lib/auth-store';
import { blockedRoute } from '@/lib/blocked-state';
import { useRoleTheme, useRole } from '@/lib/role-theme';
import {
  LogOut,
  LayoutDashboard,
  FileText,
  BarChart2,
  GraduationCap,
  Trophy,
  BookOpen,
  Users,
  Settings,
  Search,
  Menu,
  X,
  HelpCircle,
  MessageCircle,
  Upload,
  Lightbulb,
  UserCircle2,
  Layers,
  Database,
  Boxes,
  ShieldX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notification-bell';
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

function NavLinks({ role, mobile = false, onNavigate }: { role: string; mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const theme = useRoleTheme();
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'INSTITUTION_ADMIN';
  const staff = role === 'TEACHER' || isAdmin || isSuperAdmin;

  const activeClass = `bg-gradient-to-r ${theme.gradient} text-white shadow-md`;

  const superAdminLinks = isSuperAdmin
    ? [
        { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/institutions', label: 'Institutions', icon: GraduationCap },
        { href: '/app/students', label: 'Students', icon: Users },
        { href: '/app/teachers', label: 'Teachers', icon: Users },
        { href: '/app/curriculum', label: 'Curriculum', icon: Layers },
        { href: '/app/questions', label: 'Questions', icon: HelpCircle },
        { href: '/app/content-processing', label: 'Content', icon: Database },
        { href: '/app/ar', label: 'AR / 3D', icon: Boxes },
        { href: '/app/settings', label: 'Settings', icon: Settings },
      ]
    : [];

  const studentLinks = role === 'STUDENT'
    ? [
        { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/learn', label: 'Learn', icon: BookOpen },
        { href: '/app/assessments', label: 'Assessments', icon: BarChart2 },
        { href: '/app/chat', label: 'Ask Sanro AI', icon: MessageCircle },
        { href: '/app/gamification', label: 'Progress', icon: Trophy },
      ]
    : [];

  const parentLinks = role === 'PARENT'
    ? [
        { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/children', label: 'Children', icon: Users },
      ]
    : [];

  const staffLinks = staff && !isSuperAdmin
    ? [
        { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/app/learn', label: 'Learn', icon: BookOpen },
        { href: '/app/assessments', label: 'Assessments', icon: BarChart2 },
        { href: '/app/papers', label: 'Papers', icon: FileText },
        { href: '/app/remediation', label: 'Remediation', icon: Lightbulb },
        { href: '/app/reports', label: 'Reports', icon: BarChart2 },
      ]
    : [];

  const primaryLinks = isSuperAdmin ? superAdminLinks : role === 'STUDENT' ? studentLinks : role === 'PARENT' ? parentLinks : staffLinks;

  const managementLinks = staff && !isSuperAdmin
    ? [
        { href: '/app/students', label: 'Students', icon: Users },
        { href: '/app/teachers', label: 'Teachers', icon: Users },
        { href: '/app/parents', label: 'Parents', icon: Users },
        ...(isAdmin ? [{ href: '/app/import', label: 'Import', icon: Upload }] : []),
      ]
    : [];

  const contentLinks = staff && !isSuperAdmin
    ? [
        { href: '/app/curriculum', label: 'Curriculum', icon: Layers },
        { href: '/app/papers/new', label: 'New Paper', icon: FileText },
        { href: '/app/questions', label: 'Questions', icon: HelpCircle },
        { href: '/app/ar', label: 'AR / 3D', icon: Boxes },
      ]
    : [];

  if (mobile) {
    return (
      <div className="flex flex-col gap-1 p-2">
        {primaryLinks.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                active
                  ? activeClass
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
              )}
            >
              <l.icon className="h-5 w-5" />
              {l.label}
            </Link>
          );
        })}
        {managementLinks.length > 0 && (
          <>
            <div className="mx-4 my-2 border-t border-surface-100 dark:border-surface-800" />
            <p className="mx-4 text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase">Management</p>
            {managementLinks.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    active ? activeClass : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  )}
                >
                  <l.icon className="h-5 w-5" />
                  {l.label}
                </Link>
              );
            })}
          </>
        )}
        {contentLinks.length > 0 && (
          <>
            <div className="mx-4 my-2 border-t border-surface-100" />
            <p className="mx-4 text-xs font-semibold text-surface-400 uppercase">Content</p>
            {contentLinks.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                    active ? activeClass : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  )}
                >
                  <l.icon className="h-5 w-5" />
                  {l.label}
                </Link>
              );
            })}
          </>
        )}
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1">
      {primaryLinks.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all',
              active
                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}

      {/* Management Dropdown */}
      {managementLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-all">
              <Users className="h-4 w-4" />
              People
              <svg className="h-3 w-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {managementLinks.map((l) => (
              <DropdownMenuItem key={l.href} asChild>
                <Link href={l.href} className="flex items-center gap-2">
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Content Dropdown */}
      {contentLinks.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-all">
              <FileText className="h-4 w-4" />
              Content
              <svg className="h-3 w-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {contentLinks.map((l) => (
              <DropdownMenuItem key={l.href} asChild>
                <Link href={l.href} className="flex items-center gap-2">
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950">
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
                className="bg-transparent text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all">
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

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:block border-t border-surface-100 dark:border-surface-800 bg-white/50 dark:bg-surface-950/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
            <NavLinks role={user.role} />
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 shadow-lg">
            <NavLinks role={user.role} mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-8">
        {children}
      </main>
    </div>
  );
}