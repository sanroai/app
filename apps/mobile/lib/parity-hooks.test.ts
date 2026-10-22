import { QueryClient } from '@tanstack/react-query';

const mockApiAuthed = jest.fn();

jest.mock('./api', () => ({
  apiAuthed: (...args: unknown[]) => mockApiAuthed(...args),
}));

import {
  FLASHCARD_RATINGS,
  parentDashboardQuery,
  parentInstitutionQuery,
  rateFlashcardMutation,
  recalledPercent,
} from './parity-hooks';

const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

afterEach(() => {
  mockApiAuthed.mockReset();
  client.clear();
});

describe('parity hooks - parent children', () => {
  it('reads the same endpoint the web parent dashboard reads', async () => {
    mockApiAuthed.mockResolvedValue({
      parent: { name: 'Mrs Sharma', email: 'parent@sanroai.com' },
      children: [
        {
          id: 'c1',
          name: 'Aarav Sharma',
          grade: '10',
          overallMastery: 55,
          weakConcepts: [{ name: 'Cylinder, Cone, Sphere', score: 0, level: 'NEEDS_INTERVENTION' }],
          upcomingAssessments: [],
          recentActivity: [],
        },
      ],
    });

    const data = await client.fetchQuery(parentDashboardQuery);

    expect(mockApiAuthed).toHaveBeenCalledWith('/dashboard/parent');
    expect(data?.children[0].overallMastery).toBe(55);
    expect(data?.children[0].weakConcepts[0].score).toBe(0);
  });

  it('reads the institution name from /auth/me', async () => {
    mockApiAuthed.mockResolvedValue({
      id: 'u1',
      name: 'Mrs Sharma',
      memberships: [
        {
          institutionId: 'inst-1',
          role: 'PARENT',
          institution: { id: 'inst-1', name: 'Sanro AI', type: 'SCHOOL' },
        },
      ],
    });

    const institution = await client.fetchQuery(parentInstitutionQuery(null));

    expect(mockApiAuthed).toHaveBeenCalledWith('/auth/me');
    expect(institution?.name).toBe('Sanro AI');
  });
});

describe('parity hooks - flashcard rating', () => {
  it('posts the rating to the endpoint the web uses', async () => {
    mockApiAuthed.mockResolvedValue({ ok: true, rating: 'GOOD' });

    const result = await rateFlashcardMutation.mutationFn({ questionId: 'q1', rating: 'GOOD' });

    expect(mockApiAuthed).toHaveBeenCalledWith('/learning/flashcards/q1/rate', {
      method: 'POST',
      body: { rating: 'GOOD' },
    });
    expect(result.rating).toBe('GOOD');
  });

  it('offers exactly the four ratings the API accepts', () => {
    expect([...FLASHCARD_RATINGS]).toEqual(['AGAIN', 'HARD', 'GOOD', 'EASY']);
  });

  it('scores a session by the share of Good or Easy', () => {
    expect(recalledPercent([])).toBe(0);
    expect(recalledPercent(['GOOD', 'EASY', 'AGAIN', 'HARD'])).toBe(50);
    expect(recalledPercent(['GOOD', 'EASY'])).toBe(100);
  });
});
