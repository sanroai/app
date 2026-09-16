import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  BarChart3,
  Users,
  Bell,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Schools & Institutions — Sanro AI',
  description:
    'Sanro AI gives school administrators institution-wide academic visibility. Monitor performance, manage teachers, and track improvement.',
  openGraph: {
    title: 'For Schools — Sanro AI',
    description: 'Institution-wide academic monitoring and management.',
    type: 'website',
  },
};

const features = [
  {
    icon: BarChart3,
    title: 'Institution Dashboard',
    desc: 'See academic performance across all classes and subjects at a glance. Identify weak areas before they become problems.',
  },
  {
    icon: Users,
    title: 'Teacher Management',
    desc: 'Manage teachers, class assignments, and subject allocations from one place.',
  },
  {
    icon: Bell,
    title: 'Academic Monitoring',
    desc: 'Get alerts on declining performance, pending assessments, and students who need intervention.',
  },
  {
    icon: Shield,
    title: 'Multi-Class Oversight',
    desc: 'Compare performance across grades and subjects. See which classes need support.',
  },
];

export default function ForSchoolsPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-6">
            <Shield className="h-4 w-4" />
            For Schools &amp; Institutions
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">
            How is academic performance across{' '}
            <span className="gradient-text">my institution</span>?
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI gives principals and administrators a clear view of academic health across all
            classes, subjects, and teachers.
          </p>
        </div>

        {/* Features */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white p-8 shadow-card border border-surface-100"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{feature.title}</h3>
                <p className="text-surface-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mb-20">
          <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Students', value: '482', change: '+12 this month' },
                { label: 'Avg Mastery', value: '68%', change: '+4% this term' },
                { label: 'Active Assessments', value: '15', change: '3 due this week' },
                { label: 'Pending Remediation', value: '34', change: '12 overdue' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                  <div className="text-xs font-semibold uppercase text-surface-500 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
                  <div className="text-xs text-surface-500 mt-1">{stat.change}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Class Performance
                </div>
                <div className="space-y-2">
                  {[
                    { cls: 'Class 10-A', mastery: 74, color: 'from-green-500 to-emerald-500' },
                    { cls: 'Class 10-B', mastery: 68, color: 'from-amber-500 to-orange-500' },
                    { cls: 'Class 9-A', mastery: 61, color: 'from-amber-500 to-orange-500' },
                  ].map((c) => (
                    <div key={c.cls}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-surface-900">{c.cls}</span>
                        <span className="font-medium text-surface-600">{c.mastery}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-100">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${c.color}`}
                          style={{ width: `${c.mastery}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                <div className="text-xs font-semibold uppercase text-surface-500 mb-2">
                  Needs Attention
                </div>
                <div className="space-y-2">
                  {[
                    { subject: 'Physics — Light', issue: '4 concepts below 50%' },
                    { subject: 'Math — Algebra', issue: '6 students failing' },
                    { subject: 'Chemistry — Reactions', issue: '3 assessments overdue' },
                  ].map((item) => (
                    <div key={item.subject} className="text-sm">
                      <div className="font-medium text-surface-900">{item.subject}</div>
                      <div className="text-xs text-surface-500">{item.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-surface-900 mb-4">Set Up Sanro AI for Your School</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Get institution-wide academic visibility. Contact us for a demo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl inline-flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="rounded-2xl border-2 border-surface-200 bg-white px-8 py-4 text-lg font-semibold text-surface-900 hover:bg-surface-50 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
