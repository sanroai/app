import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — Sanro AI',
  description:
    'Sanro AI pricing for Indian schools. Contact us for a custom plan that fits your institution.',
  openGraph: {
    title: 'Pricing — Sanro AI',
    description: 'Plans for Indian schools.',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
            Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display text-surface-900 mb-6">
            Plans for Every{' '}
            <span className="gradient-text">School</span>
          </h1>
          <p className="text-lg text-surface-600">
            Sanro AI is designed to be affordable for Indian schools. Contact us for a custom plan
            that fits your institution.
          </p>
        </div>

        {/* What's Included */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold font-display text-surface-900 mb-8 text-center">
            What&apos;s Included
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Board-mapped assessments (CBSE Classes 1-10)',
              'Concept-level diagnosis',
              'Targeted remediation plans',
              'Retest and mastery tracking',
              'Student, teacher, and parent dashboards',
              'Question bank and paper generator',
              'Gamification (XP, streaks, badges)',
              'AI-assisted learning tutor',
              'Notifications and alerts',
              'Institution-wide analytics',
              'Multi-class and multi-subject support',
              'Mobile app access',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 border border-surface-100 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm text-surface-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-12 text-center text-white">
          <h2 className="text-3xl font-bold font-display mb-4">Get a Custom Quote</h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Every school is different. Tell us about your institution and we will create a plan
            that works for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-brand-50 transition-all shadow-xl inline-flex items-center gap-2"
            >
              Contact Us <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
