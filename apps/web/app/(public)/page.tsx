import Link from 'next/link';
import {
  GraduationCap,
  Brain,
  Trophy,
  BookOpen,
  Users,
  ArrowRight,
  Target,
  Smartphone,
  Download,
  Apple,
  ClipboardCheck,
  Search,
  Wrench,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Bell,
  Sparkles,
} from 'lucide-react';

const steps = [
  {
    icon: ClipboardCheck,
    title: 'Assess',
    description: 'Students take board-mapped assessments designed to test concept-level understanding.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    icon: Search,
    title: 'Diagnose',
    description: 'Sanro AI identifies exactly which concepts each student has not mastered.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  {
    icon: Wrench,
    title: 'Fix',
    description: 'Students receive targeted remediation: video lessons, practice quizzes, and study notes for weak concepts.',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  {
    icon: RotateCcw,
    title: 'Retest',
    description: 'Students retest their understanding to confirm the gap is closed.',
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
  {
    icon: TrendingUp,
    title: 'Improve',
    description: 'Teachers and parents see measurable improvement in concept mastery and scores.',
    color: 'from-brand-500 to-purple-600',
    bg: 'bg-brand-50',
    text: 'text-brand-600',
  },
];

const studentJourney = [
  { step: 'Today', desc: 'See what to focus on right now', icon: Target },
  { step: 'Fix This', desc: 'One-tap remediation for weak concepts', icon: Wrench },
  { step: 'Learn', desc: 'Watch video lessons and study notes', icon: BookOpen },
  { step: 'Practice', desc: 'Take quizzes to reinforce understanding', icon: ClipboardCheck },
  { step: 'Retest', desc: 'Prove the gap is closed', icon: RotateCcw },
  { step: 'Improve', desc: 'Watch mastery and scores rise', icon: TrendingUp },
];

const teacherCapabilities = [
  {
    icon: ClipboardCheck,
    title: 'Create Assessments',
    desc: 'Set up board-mapped assessments for your classes in minutes.',
  },
  {
    icon: Search,
    title: 'See Concept Gaps',
    desc: 'View which concepts each student has not mastered, class-wide or individual.',
  },
  {
    icon: Target,
    title: 'Assign Remediation',
    desc: 'Push targeted fix plans to students who need them.',
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    desc: 'Monitor mastery improvement, retest results, and class performance.',
  },
];

const schoolFeatures = [
  {
    icon: BarChart3,
    title: 'Institution Dashboard',
    desc: 'See academic performance across all classes and subjects at a glance.',
  },
  {
    icon: Users,
    title: 'Teacher Management',
    desc: 'Manage teachers, classes, and subject assignments from one place.',
  },
  {
    icon: Bell,
    title: 'Academic Monitoring',
    desc: 'Get alerts on declining performance, pending assessments, and intervention needs.',
  },
  {
    icon: Shield,
    title: 'Multi-Class Oversight',
    desc: 'Compare performance across grades and identify institutional weak areas.',
  },
];

const parentBenefits = [
  {
    icon: BarChart3,
    title: 'Child Progress',
    desc: 'See your child\'s assessment scores, mastery levels, and improvement trends.',
  },
  {
    icon: Target,
    title: 'Weak Areas',
    desc: 'Know exactly which concepts your child needs to work on.',
  },
  {
    icon: TrendingUp,
    title: 'Improvement Tracking',
    desc: 'Watch measurable progress as your child completes remediation and retests.',
  },
];

const faqs = [
  {
    q: 'What is Sanro AI?',
    a: 'Sanro AI is an academic assessment, diagnosis, and remediation platform for Indian schools. It helps students identify weak concepts, fix them with targeted practice, and measure improvement.',
  },
  {
    q: 'Which boards and classes does Sanro AI support?',
    a: 'Sanro AI currently supports CBSE Board for Classes 1 through 10, covering Science and Mathematics. More boards and subjects are on the roadmap.',
  },
  {
    q: 'How does Sanro AI differ from other learning apps?',
    a: 'SANRO is not a content library. It follows a structured loop: Assess, Diagnose, Fix, Retest, Improve. Every feature is designed to convert assessment data into specific learning interventions and measurable improvement.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Yes. The Sanro AI Android app is available for direct download. An iOS version is planned.',
  },
  {
    q: 'Can parents track their child\'s progress?',
    a: 'Yes. Parents can see their child\'s assessment results, concept mastery, weak areas, and improvement over time.',
  },
  {
    q: 'How do teachers use Sanro AI?',
    a: 'Teachers can create assessments, view concept-level diagnosis for each student, assign remediation plans, and track class performance.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-brand-50 via-white to-purple-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-200/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
              <Zap className="h-4 w-4" />
              Academic Assessment, Diagnosis &amp; Remediation
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-surface-900 mb-6 leading-tight">
              Test. Find the Gap.{' '}
              <span className="gradient-text">Fix It.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-surface-600 mb-10">
              Sanro AI is not another content app. It assesses students, diagnoses concept-level
              weaknesses, delivers targeted remediation, and measures real improvement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl shadow-brand-600/30 hover:shadow-2xl flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/features"
                className="rounded-2xl border-2 border-surface-200 bg-white px-8 py-4 text-lg font-semibold text-surface-900 hover:bg-surface-50 transition-all"
              >
                Explore Sanro AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How Sanro AI Works — 5 Steps */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              How <span className="gradient-text">Sanro AI</span> Works
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600">
              A structured five-step loop that turns assessment data into measurable improvement.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="rounded-3xl bg-white p-6 shadow-card border border-surface-100 h-full">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${step.bg} mb-4`}>
                    <step.icon className={`h-6 w-6 ${step.text}`} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-1">
                    Step {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-surface-600">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                    <ChevronRight className="h-5 w-5 text-surface-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Experience */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 mb-4">
                <Sparkles className="h-3 w-3" /> For Students
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
                What should I do <span className="gradient-text">today</span>?
              </h2>
              <p className="text-surface-600 mb-8">
                Sanro AI tells every student exactly what to work on next. No guessing, no
                wandering through content. One clear path from weak concept to mastered skill.
              </p>
              <div className="space-y-4">
                {studentJourney.map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                      <item.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">{item.step}</div>
                      <div className="text-sm text-surface-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-brand-300/40 to-purple-300/40 blur-2xl" aria-hidden />
              <div className="relative rounded-[2.75rem] border-[10px] border-surface-900 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-center bg-surface-900 py-2">
                  <div className="h-4 w-24 rounded-full bg-surface-800" />
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="text-xl font-bold text-surface-900">Your Focus Today</div>
                  <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3">
                    <div className="text-xs font-medium text-red-500">Weak concept</div>
                    <div className="text-sm font-bold text-surface-900">Light &mdash; Reflection</div>
                    <div className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-center text-xs font-bold text-white">
                      Fix This
                    </div>
                  </div>
                  <div className="rounded-2xl border border-surface-100 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-surface-500 mb-1">
                      Progress
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className="text-sm font-bold text-surface-900">285</div>
                        <div className="text-[10px] text-surface-500">XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-surface-900">5d</div>
                        <div className="text-[10px] text-surface-500">Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-surface-900">72%</div>
                        <div className="text-[10px] text-surface-500">Mastery</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Experience */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                    <div className="text-xs font-semibold uppercase text-surface-500 mb-2">Class 10 Science</div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-green-50 p-2">
                        <div className="text-lg font-bold text-green-600">18</div>
                        <div className="text-[10px] text-green-600">Mastered</div>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-2">
                        <div className="text-lg font-bold text-amber-600">9</div>
                        <div className="text-[10px] text-amber-600">Developing</div>
                      </div>
                      <div className="rounded-xl bg-red-50 p-2">
                        <div className="text-lg font-bold text-red-600">4</div>
                        <div className="text-[10px] text-red-600">Needs Help</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                    <div className="text-xs font-semibold uppercase text-surface-500 mb-2">Needs Attention</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-900">Light &mdash; Reflection</span>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">6 students</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-900">Chemical Reactions</span>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">4 students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 mb-4">
                <Users className="h-3 w-3" /> For Teachers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
                Which students need <span className="gradient-text">my attention</span>?
              </h2>
              <p className="text-surface-600 mb-8">
                Sanro AI gives teachers concept-level visibility into every student. See exactly
                who is struggling, on what, and assign targeted remediation.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {teacherCapabilities.map((cap) => (
                  <div key={cap.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                      <cap.icon className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-surface-900">{cap.title}</div>
                      <div className="text-xs text-surface-600">{cap.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School / Institution */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
              <Shield className="h-3 w-3" /> For Schools &amp; Institutions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              How is academic performance across{' '}
              <span className="gradient-text">my institution</span>?
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600">
              Institution-level dashboards give principals and administrators a clear view of
              academic health across all classes and subjects.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white p-6 shadow-card border border-surface-100"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Experience */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
                <Heart className="h-3 w-3" /> For Parents
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
                How is my child <span className="gradient-text">progressing</span>?
              </h2>
              <p className="text-surface-600 mb-8">
                Parents can see their child&apos;s assessment results, concept mastery, weak areas,
                and measurable improvement over time.
              </p>
              <div className="space-y-4">
                {parentBenefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100">
                      <benefit.icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">{benefit.title}</div>
                      <div className="text-sm text-surface-600">{benefit.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-surface-50 p-8 border border-surface-100">
              <div className="text-sm font-semibold text-surface-500 mb-3">Priya&apos;s Progress</div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-900">Science &mdash; Class 10</span>
                    <span className="text-sm font-bold text-green-600">78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100">
                    <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-surface-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-900">Mathematics &mdash; Class 10</span>
                    <span className="text-sm font-bold text-amber-600">65%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100">
                    <div className="h-2 w-[65%] rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  </div>
                </div>
                <div className="rounded-2xl bg-red-50 p-3 border border-red-100">
                  <div className="text-xs font-medium text-red-500 mb-1">Needs attention</div>
                  <div className="text-sm text-surface-900">Quadratic Equations &mdash; 3 retests pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Features */}
      <section id="features" className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Built for <span className="gradient-text">Academic Improvement</span>
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600">
              Every feature exists to support the core loop: Assess, Diagnose, Fix, Retest, Improve.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ClipboardCheck, title: 'Assessments', desc: 'Board-mapped assessments with auto-grading and instant results.' },
              { icon: Search, title: 'Concept Diagnosis', desc: 'Pinpoint exactly which concepts each student has not mastered.' },
              { icon: Target, title: 'Remediation Plans', desc: 'Targeted fix plans with video lessons, notes, and practice quizzes.' },
              { icon: RotateCcw, title: 'Retest & Verify', desc: 'Confirm that learning gaps are actually closed.' },
              { icon: Trophy, title: 'Gamification', desc: 'XP, streaks, badges, and leaderboards to keep students motivated.' },
              { icon: BookOpen, title: 'Question Bank', desc: 'Thousands of board-mapped questions with AI-generated papers.' },
              { icon: BarChart3, title: 'Reports & Analytics', desc: 'Concept-level mastery data for students, teachers, and parents.' },
              { icon: Bell, title: 'Notifications', desc: 'Real-time alerts for assessments, remediation, and achievements.' },
              { icon: Brain, title: 'AI-Assisted Learning', desc: 'Context-aware AI tutor for concept-level help and explanation.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl bg-white p-6 shadow-card border border-surface-100 hover:shadow-card-hover transition-all"
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
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Improving Student Outcomes
              </h2>
              <p className="mx-auto max-w-2xl text-white/80 mb-8">
                Set up Sanro AI for your school. Assess students, diagnose gaps, and track measurable improvement.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-brand-50 transition-all shadow-xl"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="rounded-2xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download App */}
      <section id="download" className="py-20 bg-gradient-to-b from-white to-brand-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
                <Smartphone className="h-4 w-4" />
                Available now for Android
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4 leading-tight">
                Take Sanro AI in your{' '}
                <span className="gradient-text">pocket</span>
              </h2>
              <p className="max-w-xl text-lg text-surface-600 mb-8">
                Practice, take tests, and fix weak concepts anywhere. The Sanro AI app is built
                for every learner on every phone.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
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
            <div className="relative mx-auto w-full max-w-[320px]">
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
                    <div className="text-sm font-bold text-surface-900">Light &mdash; Reflection</div>
                    <div className="mt-2 rounded-lg bg-red-500 px-3 py-1.5 text-center text-xs font-bold text-white">
                      Fix This
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl bg-white border border-surface-100 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer text-sm font-semibold text-surface-900 list-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-surface-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-sm text-surface-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Heart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}
