import type { Metadata } from 'next';
import { GraduationCap, Target, Users, BookOpen, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Sanro AI — Academic Assessment, Diagnosis & Remediation',
  description:
    'Sanro AI is an academic intelligence platform for Indian schools. We turn assessment data into specific learning interventions and measurable improvement.',
  openGraph: {
    title: 'About Sanro AI',
    description: 'Academic assessment, diagnosis & remediation platform for Indian schools.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
            <GraduationCap className="h-4 w-4" />
            About Sanro AI
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-surface-900 mb-6">
            Academic Intelligence,{' '}
            <span className="gradient-text">Not Just Content</span>
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI is built on a simple belief: every student can improve when they know exactly
            what to work on. We turn assessment data into specific learning interventions.
          </p>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold font-display text-surface-900 mb-4">Our Mission</h2>
            <p className="text-surface-600 mb-6 leading-relaxed">
              Indian schools generate assessment data every week. But that data rarely translates
              into specific action. Students don&apos;t know which concepts they haven&apos;t
              mastered. Teachers don&apos;t have concept-level visibility. Parents see marks but
              not understanding.
            </p>
            <p className="text-surface-600 leading-relaxed">
              Sanro AI closes this gap. We assess students at the concept level, diagnose exactly
              where understanding breaks down, deliver targeted remediation, and measure real
              improvement through retesting.
            </p>
          </div>
          <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
            <div className="space-y-4">
              {[
                { icon: Target, text: 'Concept-level diagnosis, not just chapter-level' },
                { icon: BookOpen, text: 'Targeted remediation for specific weak areas' },
                { icon: Award, text: 'Measurable improvement through retesting' },
                { icon: Users, text: 'Visibility for students, teachers, and parents' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <item.icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <span className="text-sm font-medium text-surface-900">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Philosophy */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-8 text-center">
            Product <span className="gradient-text">Philosophy</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Data → Action',
                desc: 'Assessment data is useless unless it tells a student what to do next. Sanro AI converts every data point into a specific learning action.',
              },
              {
                title: 'Not a Content Library',
                desc: 'Thousands of apps deliver content. Sanro AI delivers improvement. Every feature exists to support the Assess → Diagnose → Fix → Retest → Improve loop.',
              },
              {
                title: 'Built for India',
                desc: 'CBSE-mapped curriculum, Indian classroom realities, low-bandwidth design, multilingual support, and pricing that works for Indian schools.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl bg-white p-8 shadow-card border border-surface-100"
              >
                <h3 className="text-xl font-bold text-surface-900 mb-3">{item.title}</h3>
                <p className="text-surface-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Overview */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-8 text-center">
            The <span className="gradient-text">Sanro AI</span> Platform
          </h2>
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-10 text-white text-center">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-lg font-semibold">
              <span>Assess</span>
              <span className="text-white/50">→</span>
              <span>Diagnose</span>
              <span className="text-white/50">→</span>
              <span>Fix</span>
              <span className="text-white/50">→</span>
              <span>Retest</span>
              <span className="text-white/50">→</span>
              <span>Improve</span>
            </div>
            <p className="mt-6 text-white/80 max-w-2xl mx-auto">
              This is the core loop that drives every feature in Sanro AI. If a feature does not
              support this loop, it does not belong in the product.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-4">See Sanro AI in Action</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Experience how Sanro AI helps students improve. Sign up for a demo or explore the platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl flex items-center gap-2"
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
