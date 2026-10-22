import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * `POST /remediation/items/:id/status` is restricted to INSTITUTION_ADMIN and
 * TEACHER, so a student must never be offered the "mark complete" action.
 */
const h = vi.hoisted(() => ({
  role: 'STUDENT' as string,
  apiMock: vi.fn(),
}));

const PLANS = [
  {
    id: 'plan1',
    progress: 0,
    completedItems: 0,
    concept: { id: 'c1', name: 'Photosynthesis' },
    items: [
      {
        id: 'i1',
        title: 'Watch: Photosynthesis',
        contentType: 'VIDEO',
        contentId: 'content-1',
        status: 'PENDING',
      },
    ],
  },
];

vi.mock('@/lib/api-hooks', () => ({
  useDiagnosisMy: () => ({
    data: { averageScore: 40, concepts: [] },
    isLoading: false,
    error: null,
  }),
  useRemediationMy: () => ({ data: PLANS, isLoading: false, error: null }),
  useRemediationPlans: () => ({ data: PLANS, isLoading: false, error: null }),
}));

vi.mock('@/lib/role-theme', () => ({ useRole: () => h.role }));

vi.mock('@/lib/auth-store', () => ({
  useAuthStore: { getState: () => ({ token: 'token-1' }) },
}));

vi.mock('@/lib/api', () => ({
  api: (path: string, options?: { method?: string }) => h.apiMock(path, options),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import RemediationPage from './page';

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RemediationPage />
    </QueryClientProvider>,
  );
}

describe('RemediationPage role gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.role = 'STUDENT';
  });

  it('does not offer a student the staff-only "mark complete" action', async () => {
    renderPage();
    expect(await screen.findByText('Photosynthesis')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument();
    // the student is pointed at the work instead
    const open = screen.getByRole('link', { name: /open/i });
    expect(open).toHaveAttribute('href', '/app/library/item/content-1');
  });

  it('keeps "mark complete" for a teacher', async () => {
    h.role = 'TEACHER';
    renderPage();
    expect(await screen.findByText('Photosynthesis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });

  it('keeps "mark complete" for an institution admin', async () => {
    h.role = 'INSTITUTION_ADMIN';
    renderPage();
    expect(await screen.findByText('Photosynthesis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
  });
});
