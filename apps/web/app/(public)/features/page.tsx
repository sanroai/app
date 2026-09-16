import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Target,
  RotateCcw,
  TrendingUp,
  Trophy,
  BookOpen,
  BarChart3,
  Bell,
  Brain,
  Users,
  Zap,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features — Sanro AI',
  description:
    'Explore Sanro AI features: assessments, concept diagnosis, remediation, retesting, gamification, question bank, AI tutor, and more.',
  openGraph: {
    title: 'Sanro AI Features',
    description: 'Assessment, diagnosis, remediation, and measurable improvement.',
    type: 'website',
  },
};

const coreLoop = [
  {
    icon: ClipboardCheck,
    title: 'Assessments',
    desc: 'Board-mapped assessments with auto-grading and instant results. Students are tested at the concept level, not just the chapter level.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Search,
    title: 'Concept Diagnosis',
    desc: 'After every assessment, Sanro AI identifies exactly which concepts each student has not mastered. Teachers see class-wide and individual gaps.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Target,
    title: 'Remediation Plans',
    desc: 'Students receive targeted fix plans for weak concepts: video lessons, study notes, practice quizzes, and flashcards.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: RotateCcw,
    title: 'Retest & Verify',
    desc: 'Students retest their understanding to confirm the gap is closed. Mastery is only updated after successful retesting.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: TrendingUp,
    title: 'Measurable Improvement',
    desc: 'Teachers and parents see actual improvement in concept mastery and assessment scores over time.',
    color: 'bg-brand-50 text-brand-600',
  },
];

const additionalFeatures = [
  {
    icon: Trophy,
    title: 'Gamification',
    desc: 'XP points, daily streaks, badges, and leaderboards keep students engaged and motivated.',
  },
  {
    icon: BookOpen,
    title: 'Question Bank',
    desc: 'Thousands of board-mapped questions with difficulty levels, types, and AI-generated paper generation.',
  },
  {
    icon: Brain,
    title: 'AI-Assisted Learning',
    desc: 'Context-aware AI tutor that helps students understand concepts they are struggling with.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    desc: 'Concept-level mastery dashboards for students, teachers, parents, and institution admins.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    desc: 'Real-time alerts for new assessments, remediation plans, achievements, and deadlines.',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    desc: 'Dedicated dashboards and workflows for students, teachers, parents, admins, and super admins.',
  },
];

export default function FeaturesPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
            <Zap className="h-4 w-4" />
            Product Features
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">
            Every Feature Serves{' '}
            <span className="gradient-text">One Purpose</span>
          </h1>
          <p className="text-lg text-surface-600">
            If a feature does not support Assess → Diagnose → Fix → Retest → Improve, it does
            not belong in Sanro AI.
          </p>
        </div>

        {/* Core Loop Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-surface-900 mb-4 text-center">
            The Core <span className="gradient-text">Loop</span>
          </h2>
          <p className="text-center text-surface-600 mb-12 max-w-2xl mx-auto">
            These five capabilities form the backbone of Sanro AI. Each one feeds the next.
          </p>
          <div className="space-y-6">
            {coreLoop.map((feature, i) => (
              <div
                key={feature.title}
                className="flex flex-col md:flex-row items-start gap-6 rounded-3xl bg-white p-6 md:p-8 shadow-card border border-surface-100"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-50 border border-surface-100">
                  <span className="text-xl font-bold text-surface-400">{i + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${feature.color}`}>
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xl font-bold text-surface-900">{feature.title}</h3>
                  </div>
                  <p className="text-surface-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-surface-900 mb-12 text-center">
            Additional <span className="gradient-text">Capabilities</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white p-6 shadow-card border border-surface-100"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 mb-4">
                  <feature.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-900 mb-4">Ready to Try Sanro AI?</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            See how Sanro AI can improve learning outcomes at your school.
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
