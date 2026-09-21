import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Download,
  Apple,
  CheckCircle2,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Download Sanro AI App — Android',
  description:
    'Download the Sanro AI Android app. Practice, take tests, and fix weak concepts anywhere.',
  openGraph: {
    title: 'Download Sanro AI',
    description: 'Sanro AI Android app for students.',
    type: 'website',
  },
};

const features = [
  'Board-mapped assessments (CBSE Classes 1-10)',
  'Concept-level diagnosis and remediation',
  'Video lessons, study notes, and flashcards',
  'Practice quizzes with mastery tracking',
  'XP, streaks, badges, and leaderboards',
  'AI-assisted learning tutor',
  'Works on any Android phone',
  'Built for slow networks',
];

export default function DownloadPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
              <Smartphone className="h-4 w-4" />
              Sanro AI Mobile App
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-surface-900 mb-6">
              Take Sanro AI{' '}
              <span className="gradient-text">Everywhere</span>
            </h1>
            <p className="text-lg text-surface-600 mb-8">
              Practice, take tests, and fix weak concepts anywhere. The Sanro AI app is built
              for every learner on every phone.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <a
                href="/downloads/sanroai.apk"
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-4 text-white shadow-xl shadow-brand-600/25 hover:shadow-2xl transition-all"
              >
                <Download className="h-6 w-6" />
                <span className="text-left">
                  <span className="block text-xs font-medium text-white/80">Download for</span>
                  <span className="block text-lg font-bold leading-tight">Android</span>
                </span>
              </a>
              <button
                type="button"
                disabled
                aria-disabled="true"
                title="Coming soon to the App Store"
                className="inline-flex items-center gap-3 rounded-2xl border-2 border-surface-200 bg-white px-6 py-4 text-surface-400 opacity-70 cursor-not-allowed"
              >
                <Apple className="h-6 w-6" />
                <span className="text-left">
                  <span className="block text-xs font-medium">Coming soon</span>
                  <span className="block text-lg font-bold leading-tight">App Store</span>
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-surface-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Direct APK download
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Always the latest version
              </span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-[300px]" aria-hidden="true">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-300/40 to-purple-300/40 blur-2xl" aria-hidden />
            <div className="relative rounded-[2.75rem] border-[10px] border-surface-900 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-center bg-surface-900 py-2">
                <div className="h-4 w-24 rounded-full bg-surface-800" />
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="text-xl font-bold text-surface-900">Learn</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-surface-50 px-2 py-3 text-center">
                    <div className="text-sm font-bold text-surface-900">285</div>
                    <div className="text-[10px] text-surface-500">XP</div>
                  </div>
                  <div className="rounded-xl bg-surface-50 px-2 py-3 text-center">
                    <div className="text-sm font-bold text-surface-900">5d</div>
                    <div className="text-[10px] text-surface-500">Streak</div>
                  </div>
                  <div className="rounded-xl bg-surface-50 px-2 py-3 text-center">
                    <div className="text-sm font-bold text-surface-900">72%</div>
                    <div className="text-[10px] text-surface-500">Mastery</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3">
                  <div className="text-[10px] font-medium text-red-500">Weak concept</div>
                  <div className="text-sm font-bold text-surface-900">Light — Reflection</div>
                  <div className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-center text-xs font-bold text-white">
                    Fix This
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-8 text-center">
            What You Get
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {features.map((feature) => (
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

        {/* Installation */}
        <div className="mb-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-8 text-center">
            Installation <span className="gradient-text">Instructions</span>
          </h2>
          <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100 space-y-4">
            {[
              { step: 1, text: 'Tap the "Download for Android" button above.' },
              { step: 2, text: 'If prompted, allow installation from unknown sources in your browser settings.' },
              { step: 3, text: 'Open the downloaded APK file and tap Install.' },
              { step: 4, text: 'Open Sanro AI and sign in with your account.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                  {item.step}
                </div>
                <p className="text-sm text-surface-700 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold font-display text-surface-900 mb-4">Ready to Start?</h2>
          <p className="text-surface-600 mb-8 max-w-xl mx-auto">
            Sign in to your Sanro AI account or create a new one.
          </p>
          <Link
            href="/login"
            className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl inline-flex items-center gap-2"
          >
            Sign In <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
