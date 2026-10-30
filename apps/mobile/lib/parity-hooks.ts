import { useQuery } from '@tanstack/react-query';
import { apiAuthed } from './api';
import { useAuthStore } from './auth-store';

/**
 * Hooks that close the web <-> mobile parity gaps (docs/PARITY_POLICY.md).
 *
 * They live outside `lib/hooks.ts` because that file is owned by another agent.
 * Everything here reads the SAME endpoint the web client reads, so both
 * platforms show the same numbers - never a second, mobile-only endpoint.
 */

// â”€â”€â”€ Parent: children (GET /dashboard/parent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// The web parent dashboard (`app/(dashboard)/app/children/page.tsx`) reads
// `GET /dashboard/parent`. The mobile screen used to read
// `GET /parents/me/dashboard`, whose shape differs (`studentId`/`overall` vs
// `id`/`overallMastery`) - so the phone rendered no mastery badge and no
// institution name even though the API had the data.
//
// Payload verified against the running API (2026-10-22) with the demo parent:
//
//   GET /dashboard/parent ->
//     {
//       parent: { name, email },
//       children: [{
//         id, name, grade,
//         overallMastery,                       // number, 0 when there is no mastery yet
//         weakConcepts: [{ name, score, level }],
//         upcomingAssessments: [{ title, date, subject }],
//         recentActivity: [{ type, title, score, date }],
//       }],
//     }

export interface ParentWeakConcept {
  name: string;
  score: number;
  level: string;
}

export interface ParentUpcomingAssessment {
  title: string;
  date: string | null;
  subject: string;
}

export interface ParentRecentActivity {
  type: string;
  title: string;
  score: number | null;
  date: string;
}

export interface ParentChild {
  id: string;
  name: string;
  grade: string | null;
  overallMastery: number;
  weakConcepts: ParentWeakConcept[];
  upcomingAssessments: ParentUpcomingAssessment[];
  recentActivity: ParentRecentActivity[];
}

export interface ParentDashboard {
  parent: { name: string; email: string } | null;
  children: ParentChild[];
}

export const parentDashboardQuery = {
  queryKey: ['dashboard', 'parent'],
  queryFn: () => apiAuthed<ParentDashboard>('/dashboard/parent'),
};

export function useParentDashboard() {
  return useQuery<ParentDashboard>(parentDashboardQuery);
}

interface AuthMeMembership {
  institutionId: string;
  role: string;
  institution: { id: string; name: string; type: string } | null;
}

interface AuthMe {
  id: string;
  name: string;
  memberships: AuthMeMembership[];
}

export interface ParentInstitution {
  id: string;
  name: string;
  type: string;
}

/**
 * The school the family belongs to. `GET /auth/me` is the only endpoint that
 * carries the institution name for the signed-in account, so the children
 * screen reads it from there (the parent dashboard itself has no institution
 * field).
 */
export function parentInstitutionQuery(institutionId: string | null) {
  return {
    queryKey: ['auth', 'me', 'institution', institutionId],
    queryFn: async (): Promise<ParentInstitution | null> => {
      const me = await apiAuthed<AuthMe>('/auth/me');
      const memberships = me.memberships ?? [];
      const match =
        memberships.find((m) => m.institutionId === institutionId) ??
        memberships.find((m) => m.role === 'PARENT') ??
        memberships[0];
      const institution = match?.institution;
      if (!institution) return null;
      return { id: institution.id, name: institution.name, type: institution.type };
    },
  };
}

export function useParentInstitution() {
  const institutionId = useAuthStore((s) => s.user?.institutionId ?? null);
  return useQuery<ParentInstitution | null>(parentInstitutionQuery(institutionId));
}
