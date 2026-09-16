import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Target,
  Wrench,
  BookOpen,
  ClipboardCheck,
  RotateCcw,
  TrendingUp,
  Trophy,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Students — Sanro AI',
  description:
    'Sanro AI helps students find weak concepts, fix them with targeted practice, and measure real improvement.',
  openGraph: {
    title: 'For Students — Sanro AI',
    description: 'Find weak concepts, fix them, and improve.',
    type: 'website',
  },
};

const journey = [
  {
    icon: Target,
    title: 'See Your Focus',
    desc: 'Sanro AI shows you exactly what to work on today. No guessing, no wandering through content.',
  },
  {
    icon: Wrench,
    title: 'Fix Weak Concepts',
    desc: 'One-tap remediation for each weak concept: video lessons, study notes, and practice quizzes.',
  },
  {
    icon: BookOpen,
    title: 'Learn at Your Pace',
    desc: 'Watch video lessons, read notes, and use flashcards to understand concepts you struggle with.',
  },
  {
    icon: ClipboardCheck,
    title: 'Practice & Quiz',
    desc: 'Test your understanding with concept-specific quizzes and practice sessions.',
  },
  {
    icon: RotateCcw,
    title: 'Retest',
    desc: 'Prove that you have closed the gap. Sanro AI only marks a concept as mastered after a successful retest.',
  },
  {
    icon: TrendingUp,
    title: 'Watch Yourself Improve',
    desc: 'See your mastery, XP, streaks, and scores grow as you complete remediation and retests.',
  },
];

export default function ForStudentsPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
            <Smartphone className="h-4 w-4" />
            For Students
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">
            What should I do{' '}
            <span className="gradient-text">today</span>?
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI tells you exactly what to work on next. One clear path from weak concept to
            mastered skill.
          </p>
        </div>

        {/* Journey */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-surface-900 mb-12 text-center">
            Your Learning <span className="gradient-text">Journey</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {journey.map((step, i) => (
              <div
                key={step.title}
                className="rounded-3xl bg-white p-6 shadow-card border border-surface-100 relative"
              >
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold">
                  {i + 1}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 mb-4">
                  <step.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{step.title}</h3>
                <p className="text-sm text-surface-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What You Get */}
        <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-surface-900 mb-4">
              Built for <span className="gradient-text">Every Learner</span>
            </h2>
            <p className="text-surface-600 mb-6 leading-relaxed">
              Whether you are preparing for board exams or trying to catch up on a specific topic,
              Sanro AI gives you a clear, structured path to improvement.
            </p>
            <ul className="space-y-3">
              {[
                'Board-mapped content for CBSE Classes 1-10',
                'Science and Mathematics coverage',
                'Video lessons, study notes, and flashcards',
                'Concept-specific quizzes and practice',
                'XP, streaks, badges, and leaderboards',
                'AI tutor for concept-level help',
                'Works on any Android phone',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Your Focus Today
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-3">
                  <div className="text-xs font-medium text-red-500">Weak concept</div>
                  <div className="text-sm font-bold text-surface-900">
                    Quadratic Equations
                  </div>
                  <div className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-center text-xs font-bold text-white">
                    Fix This
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Your Progress
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                    <div className="text-sm font-bold text-surface-900">285 XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-surface-900">5d streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600">72% mastery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-900 mb-4">Start Improving Today</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Download the Sanro AI app or sign in to your account.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/downloads/sanroai.apk"
              className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl inline-flex items-center gap-2"
            >
              Download App <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/login"
              className="rounded-2xl border-2 border-surface-200 bg-white px-8 py-4 text-lg font-semibold text-surface-900 hover:bg-surface-50 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
