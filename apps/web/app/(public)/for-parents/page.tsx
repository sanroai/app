import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Heart,
  BarChart3,
  Target,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Parents — Sanro AI',
  description:
    'Parents can see their child\'s assessment results, concept mastery, weak areas, and measurable improvement over time.',
  openGraph: {
    title: 'For Parents — Sanro AI',
    description: 'Track your child\'s academic progress and improvement.',
    type: 'website',
  },
};

const benefits = [
  {
    icon: BarChart3,
    title: 'See Real Progress',
    desc: 'View your child\'s assessment scores, concept mastery levels, and improvement trends — not just marks.',
  },
  {
    icon: Target,
    title: 'Know Weak Areas',
    desc: 'See exactly which concepts your child has not mastered and what Sanro AI is doing to help.',
  },
  {
    icon: TrendingUp,
    title: 'Watch Improvement',
    desc: 'Track measurable progress as your child completes remediation, retests, and masters concepts.',
  },
];

export default function ForParentsPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 mb-6">
            <Heart className="h-4 w-4" />
            For Parents
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-surface-900 mb-6">
            How is my child{' '}
            <span className="gradient-text">progressing</span>?
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI gives you visibility into your child&apos;s actual understanding — not just
            marks on a report card.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-3xl bg-white p-8 shadow-card border border-surface-100"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 mb-4">
                  <benefit.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{benefit.title}</h3>
                <p className="text-surface-600 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mb-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold font-display text-surface-900 mb-4">
              Your Child&apos;s <span className="gradient-text">Dashboard</span>
            </h2>
            <p className="text-surface-600 mb-6 leading-relaxed">
              Sanro AI shows you what matters: which concepts your child has mastered, which need
              work, and whether improvement is happening.
            </p>
            <ul className="space-y-3">
              {[
                'Concept-level mastery for each subject',
                'Assessment scores and trends',
                'Weak areas and active remediation',
                'Retest results and improvement',
                'Daily streak and engagement',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 md:order-2 rounded-3xl bg-surface-50 p-8 border border-surface-100">
            <div className="text-sm font-semibold text-surface-500 mb-4">Priya&apos;s Progress</div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-900">Science — Class 10</span>
                  <span className="text-sm font-bold text-green-600">78%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-100">
                  <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-surface-900">
                    Mathematics — Class 10
                  </span>
                  <span className="text-sm font-bold text-amber-600">65%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-100">
                  <div className="h-2 w-[65%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                </div>
              </div>
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100">
                <div className="text-xs font-medium text-red-500 mb-1">Needs attention</div>
                <div className="text-sm text-surface-900">
                  Quadratic Equations — 3 retests pending
                </div>
              </div>
              <div className="rounded-2xl bg-green-50 p-4 border border-green-100">
                <div className="text-xs font-medium text-green-600 mb-1">Improving</div>
                <div className="text-sm text-surface-900">
                  Light — Reflection: 42% → 71% this month
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-4">Track Your Child&apos;s Progress</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Sign in to see your child&apos;s concept mastery, weak areas, and improvement.
          </p>
          <Link
            href="/register"
            className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl inline-flex items-center gap-2"
          >
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
