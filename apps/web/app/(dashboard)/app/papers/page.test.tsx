import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the four modules the page imports so we can drive `role` deterministically.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api-hooks', () => ({ usePapers: () => ({ data: [], isLoading: false, error: null }) }));

// useAuthStore is a Zustand store; stub it to return a controllable user.
const mockUser = vi.fn();
vi.mock('@/lib/auth-store', () => ({ useAuthStore: () => ({ user: mockUser() }) }));

// Mirror the real useRole(): `(user?.role as RoleKey) || 'STUDENT'`, so the button
// logic (which reads useRole) and the guard (which reads useAuthStore) stay in sync,
// exactly as they are in production.
vi.mock('@/lib/role-theme', () => ({ useRole: () => mockUser()?.role ?? 'STUDENT' }));

import PapersPage from './page';

function setUser(role: string | null) {
  mockUser.mockReturnValue(role ? { id: 'u1', role } : null);
}

describe('PapersPage role guard (FINDING-G)', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['STUDENT', 'PARENT'])('blocks %s with an access-denied message', (role) => {
    setUser(role);
    render(<PapersPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Question papers')).not.toBeInTheDocument();
  });

  it.each(['TEACHER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'])('allows %s to see the papers list', (role) => {
    setUser(role);
    render(<PapersPage />);
    expect(screen.getByText('Question papers')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('hides the "New paper" button from SUPER_ADMIN but shows it to staff', () => {
    setUser('SUPER_ADMIN');
    const { unmount } = render(<PapersPage />);
    expect(screen.queryByRole('button', { name: /new paper/i })).not.toBeInTheDocument();
    unmount();

    setUser('TEACHER');
    render(<PapersPage />);
    expect(screen.getByRole('button', { name: /new paper/i })).toBeInTheDocument();
  });

  it('treats a missing user (pre-hydration) as unauthorized', () => {
    setUser(null);
    render(<PapersPage />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
