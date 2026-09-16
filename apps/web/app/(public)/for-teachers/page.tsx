import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users,
  ClipboardCheck,
  Search,
  Target,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Teachers — Sanro AI',
  description:
    'Sanro AI gives teachers concept-level visibility into every student. See who is struggling, on what, and assign targeted remediation.',
  openGraph: {
    title: 'For Teachers — Sanro AI',
    description: 'Concept-level visibility into student performance.',
    type: 'website',
  },
};

const capabilities = [
  {
    icon: ClipboardCheck,
    title: 'Create Assessments',
    desc: 'Set up board-mapped assessments for your classes. Auto-grading gives you instant results.',
  },
  {
    icon: Search,
    title: 'See Concept Gaps',
    desc: 'View exactly which concepts each student has not mastered. See class-wide patterns and individual struggles.',
  },
  {
    icon: Target,
    title: 'Assign Remediation',
    desc: 'Push targeted fix plans to students who need them. Sanro AI delivers video lessons, notes, and quizzes.',
  },
  {
    icon: BarChart3,
    title: 'Track Improvement',
    desc: 'Monitor mastery improvement, retest results, and overall class performance over time.',
  },
];

export default function ForTeachersPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 mb-6">
            <Users className="h-4 w-4" />
            For Teachers
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">
            Which students need{' '}
            <span className="gradient-text">my attention</span>?
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI gives you concept-level visibility into every student. See exactly who is
            struggling, on what, and take action.
          </p>
        </div>

        {/* Capabilities */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="rounded-3xl bg-white p-8 shadow-card border border-surface-100"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 mb-4">
                  <cap.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{cap.title}</h3>
                <p className="text-surface-600 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Teachers See */}
        <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100 mb-4">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Class 10 Science — Concept Mastery
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-green-50 p-3">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-xs text-green-600">Mastered</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3">
                    <div className="text-2xl font-bold text-amber-600">9</div>
                    <div className="text-xs text-amber-600">Developing</div>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3">
                    <div className="text-2xl font-bold text-red-600">4</div>
                    <div className="text-xs text-red-600">Needs Help</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Needs Intervention
                </div>
                <div className="space-y-2">
                  {[
                    { concept: 'Light — Reflection', students: 6, level: 'red' },
                    { concept: 'Chemical Reactions', students: 4, level: 'amber' },
                    { concept: 'Electric Current', students: 3, level: 'amber' },
                  ].map((item) => (
                    <div key={item.concept} className="flex items-center justify-between text-sm">
                      <span className="text-surface-900">{item.concept}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.level === 'red'
                            ? 'text-red-600 bg-red-50'
                            : 'text-amber-600 bg-amber-50'
                        }`}
                      >
                        {item.students} students
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Concept-Level <span className="gradient-text">Visibility</span>
            </h2>
            <p className="text-surface-600 mb-6 leading-relaxed">
              Sanro AI does not just show you marks. It shows you exactly which concepts each
              student understands and which they do not.
            </p>
            <ul className="space-y-3">
              {[
                'Class-wide concept mastery overview',
                'Individual student diagnosis',
                'Weak concept identification',
                'Remediation assignment and tracking',
                'Retest result monitoring',
                'Performance trends over time',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-900 mb-4">Start Using Sanro AI</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Set up Sanro AI for your classes and start seeing concept-level student data.
          </p>
          <Link
            href="/login"
            className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl inline-flex items-center gap-2"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
