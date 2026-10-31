import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * The attempt screen has to ask the question the API actually grades:
 * MCQ / TRUE_FALSE answer with the option text, MULTI_SELECT with a JSON array
 * of the selected option texts.
 */
const h = vi.hoisted(() => ({
  apiMock: vi.fn(),
}));

const ATTEMPT = {
  attempt: {
    id: 'a1',
    status: 'IN_PROGRESS',
    score: null,
    maxScore: 10,
    correctCount: null,
    wrongCount: null,
    skippedCount: null,
    accuracy: null,
    timeSpentSeconds: null,
    startedAt: null,
    submittedAt: null,
  },
  assessment: { title: 'Unit test', subject: 'Science', totalMarks: 10 },
  questions: [
    {
      id: 'q1',
      text: 'Select every even number',
      type: 'MULTI_SELECT',
      marks: 2,
      order: 1,
      options: [{ text: '2' }, { text: '3' }, { text: '4' }],
      yourAnswer: null,
      correctAnswer: null,
      isCorrect: null,
      marksAwarded: null,
    },
    {
      id: 'q2',
      text: 'The sky is blue',
      type: 'TRUE_FALSE',
      marks: 1,
      order: 2,
      options: [{ text: 'True' }, { text: 'False' }],
      yourAnswer: null,
      correctAnswer: null,
      isCorrect: null,
      marksAwarded: null,
    },
    {
      id: 'q3',
      text: 'Explain your answer',
      type: 'SHORT_ANSWER',
      marks: 3,
      order: 3,
      options: [],
      yourAnswer: null,
      correctAnswer: null,
      isCorrect: null,
      marksAwarded: null,
    },
  ],
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ attemptId: 'a1' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/api-hooks', () => ({
  useAttempt: () => ({ data: ATTEMPT, isLoading: false, error: null }),
}));

vi.mock('@/lib/auth-store', () => ({
  useAuthStore: { getState: () => ({ token: 'token-1' }) },
}));

vi.mock('@/lib/api', () => ({
  api: (path: string, options?: { method?: string; body?: unknown }) => h.apiMock(path, options),
}));

import AttemptPage from './page';

function renderAttempt() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AttemptPage />
    </QueryClientProvider>,
  );
}

describe('AttemptPage question types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.apiMock.mockResolvedValue({ ok: true });
  });

  it('renders MULTI_SELECT as toggleable options', async () => {
    const user = userEvent.setup();
    renderAttempt();

    await screen.findByText('Select every even number');
    // every option is a button, not a text field
    expect(screen.getByRole('button', { name: 'A 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C 4' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'A 2' }));
    await user.click(screen.getByRole('button', { name: 'C 4' }));
    await user.click(screen.getByRole('button', { name: /save answers/i }));

    await waitFor(() => expect(h.apiMock).toHaveBeenCalled());
    const [, options] = h.apiMock.mock.calls.find(([p]) => String(p).endsWith('/answers')) ?? [];
    const body = options?.body as { answers: Array<{ snapshotQuestionId: string; answer: string }> };
    const multi = body.answers.find((a) => a.snapshotQuestionId === 'q1');
    // the API expects a JSON array of the selected option texts
    expect(JSON.parse(multi!.answer)).toEqual(['2', '4']);
  });

  it('renders TRUE_FALSE as options instead of a text field', async () => {
    renderAttempt();
    await screen.findByText('The sky is blue');
    expect(screen.getByRole('button', { name: 'A True' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'B False' })).toBeInTheDocument();
  });

  it('keeps a text field for a written answer', async () => {
    renderAttempt();
    await screen.findByText('Explain your answer');
    expect(screen.getByPlaceholderText('Type your answer…')).toBeInTheDocument();
  });

  it('stores the answers before it submits the attempt', async () => {
    const user = userEvent.setup();
    renderAttempt();

    await screen.findByText('The sky is blue');
    await user.click(screen.getByRole('button', { name: 'A True' }));
    await user.click(screen.getByRole('button', { name: /submit attempt/i }));
    await user.click(screen.getByRole('button', { name: /confirm submit/i }));

    await waitFor(() => {
      const paths = h.apiMock.mock.calls.map(([p]) => String(p));
      expect(paths).toContain('/assessments/attempts/a1/answers');
      expect(paths).toContain('/assessments/attempts/a1/submit');
    });
    const paths = h.apiMock.mock.calls.map(([p]) => String(p));
    expect(paths.indexOf('/assessments/attempts/a1/answers')).toBeLessThan(
      paths.indexOf('/assessments/attempts/a1/submit'),
    );
  });
});
