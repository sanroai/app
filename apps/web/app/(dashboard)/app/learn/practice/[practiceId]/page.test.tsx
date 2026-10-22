import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Regression tests for the practice screen:
 * - the submit must wait for the answer saves that are still in flight (the API
 *   grades the answers it has stored, so a late save used to be scored wrong),
 * - "Practice Again" must start a NEW session (a completed set cannot be reopened),
 * - a missing token must not leave the page on a skeleton forever.
 */
const h = vi.hoisted(() => ({
  calls: [] as string[],
  apiMock: vi.fn(),
  saveMutateAsync: vi.fn(),
  startMutateAsync: vi.fn(),
  push: vi.fn(),
  resolveSave: null as null | (() => void),
  auth: { token: 'token-1' as string | null, _hasHydrated: true },
}));

const PRACTICE = {
  practiceId: 'p1',
  status: 'IN_PROGRESS',
  conceptId: 'c1',
  questions: [
    {
      id: 'q1',
      text: 'What is 2 + 2?',
      type: 'MCQ',
      marks: 1,
      options: [
        { id: 'o1', text: '4', order: 1 },
        { id: 'o2', text: '5', order: 2 },
      ],
    },
  ],
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ practiceId: 'p1' }),
  useRouter: () => ({ push: h.push, back: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/auth-store', () => ({
  useAuthStore: (selector: (state: { token: string | null; _hasHydrated: boolean }) => unknown) =>
    selector(h.auth),
}));

vi.mock('@/lib/api', () => ({
  api: (path: string, options?: { method?: string }) => h.apiMock(path, options),
}));

vi.mock('@/lib/learning-hooks', () => ({
  useSavePracticeAnswer: () => ({ mutateAsync: h.saveMutateAsync }),
  useStartPractice: () => ({ mutateAsync: h.startMutateAsync }),
}));

import PracticePage from './page';

function renderPractice() {
  return render(<PracticePage />);
}

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.calls = [];
    h.resolveSave = null;
    h.auth = { token: 'token-1', _hasHydrated: true };
    h.apiMock.mockImplementation((path: string, options?: { method?: string }) => {
      if (options?.method === 'POST' && path.endsWith('/submit')) {
        h.calls.push('submit');
        return Promise.resolve({
          score: 100,
          totalQuestions: 1,
          correctAnswers: 1,
          masteryUpdate: null,
        });
      }
      if (options?.method === 'POST' && path.endsWith('/answer')) {
        h.calls.push('answer');
        return Promise.resolve({ correct: true });
      }
      return Promise.resolve(PRACTICE);
    });
  });

  it('submits only after the in-flight answer save has landed', async () => {
    const user = userEvent.setup();
    h.saveMutateAsync.mockImplementation(() => {
      h.calls.push('save:start');
      return new Promise((resolve) => {
        h.resolveSave = () => {
          h.calls.push('save:end');
          resolve({ correct: true });
        };
      });
    });

    renderPractice();
    await screen.findByText('What is 2 + 2?');

    await user.click(screen.getByText('4'));
    await user.click(screen.getByRole('button', { name: 'Submit Practice' }));

    // the answer is still in flight: the submit must not have been sent yet
    expect(h.calls).toEqual(['save:start']);

    h.resolveSave?.();
    await waitFor(() => expect(h.calls).toContain('submit'));
    expect(h.calls.indexOf('save:end')).toBeLessThan(h.calls.indexOf('submit'));
  });

  it('starts a new practice session when the student retries', async () => {
    const user = userEvent.setup();
    h.saveMutateAsync.mockResolvedValue({ correct: true });
    h.startMutateAsync.mockResolvedValue({ practiceId: 'p2', questions: [] });

    renderPractice();
    await screen.findByText('What is 2 + 2?');

    await user.click(screen.getByText('4'));
    await user.click(screen.getByRole('button', { name: 'Submit Practice' }));

    await screen.findByText('Practice Complete!');
    await user.click(screen.getByRole('button', { name: /practice again/i }));

    await waitFor(() => expect(h.startMutateAsync).toHaveBeenCalled());
    expect(h.startMutateAsync.mock.calls[0][0]).toMatchObject({ conceptId: 'c1' });
    await waitFor(() =>
      expect(h.push).toHaveBeenCalledWith('/app/learn/practice/p2'),
    );
    // the completed set is never re-opened
    expect(h.push).not.toHaveBeenCalledWith('/app/learn/practice/p1');
  });

  it('asks the student to sign in instead of showing a skeleton forever', async () => {
    h.auth = { token: null, _hasHydrated: true };
    renderPractice();
    expect(await screen.findByText('Please sign in to practise.')).toBeInTheDocument();
    expect(h.apiMock).not.toHaveBeenCalled();
  });
});
