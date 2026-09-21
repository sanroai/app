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
  Lightbulb,
  Eye,
  Heart,
} from 'lucide-react';

const steps = [
  {
    icon: ClipboardCheck,
    title: 'Assess',
    description: 'Students take board-mapped assessments that test understanding at the concept level — not just memorisation.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    icon: Search,
    title: 'Diagnose',
    description: 'SANRO pinpoints exactly which concepts each student has not mastered — and why.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  {
    icon: Wrench,
    title: 'Fix',
    description: 'Students get targeted learning: video lessons, practice quizzes, and study notes for their specific weak concepts.',
    color: 'from-rose-500 to-red-500',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: RotateCcw,
    title: 'Retest',
    description: 'Students retest to confirm the gap is actually closed — not just revisited.',
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    icon: TrendingUp,
    title: 'Improve',
    description: 'Teachers and parents see measurable improvement in concept mastery and assessment scores.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
];

const studentJourney = [
  { step: 'Today', desc: 'See exactly what to work on right now', icon: Target },
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
    desc: 'View which concepts each student has not mastered — class-wide or individual.',
  },
  {
    icon: Target,
    title: 'Assign Remediation',
    desc: 'Push targeted fix plans to students who need them.',
  },
  {
    icon: BarChart3,
    title: 'Track Improvement',
    desc: 'Monitor mastery gains, retest results, and class performance trends.',
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
    title: 'Academic Alerts',
    desc: 'Get notified about declining performance, pending assessments, and intervention needs.',
  },
  {
    icon: Shield,
    title: 'Multi-Class Oversight',
    desc: 'Compare performance across grades and identify institutional weak areas.',
  },
];

const parentBenefits = [
  {
    icon: Eye,
    title: 'See What Your Child Knows',
    desc: 'View assessment scores, concept mastery levels, and learning patterns.',
  },
  {
    icon: Target,
    title: 'Know What Needs Work',
    desc: 'See exactly which concepts your child needs to focus on.',
  },
  {
    icon: TrendingUp,
    title: 'Watch Real Improvement',
    desc: 'Track measurable progress as your child completes remediation and retests.',
  },
];

const faqs = [
  {
    q: 'What is Sanro AI?',
    a: 'Sanro AI is an academic assessment, diagnosis, and remediation platform for Indian schools. It helps students identify weak concepts, fix them with targeted practice, and measure real improvement.',
  },
  {
    q: 'Which boards and classes does Sanro AI support?',
    a: 'Sanro AI currently supports CBSE Board for Classes 1 through 10, covering Science and Mathematics. More boards and subjects are on the roadmap.',
  },
  {
    q: 'How is Sanro AI different from other learning apps?',
    a: 'SANRO is not a content library. It follows a structured loop: Assess, Diagnose, Fix, Retest, Improve. Every feature is designed to convert assessment data into specific learning actions and measurable improvement.',
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
    a: 'Teachers can create assessments, view concept-level diagnosis for each student, assign remediation plans, and track class performance trends.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero — Problem → Solution */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50 via-white to-white" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 mb-6">
              <GraduationCap className="h-4 w-4" />
              Academic Intelligence Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-surface-900 mb-6 leading-tight">
              Every test should tell you
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                what to do next.
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-surface-600 mb-10 leading-relaxed">
              Marks tell you how a student scored. SANRO tells you what the student doesn&apos;t understand — and exactly how to fix it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-xl shadow-violet-600/25 hover:shadow-2xl flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/features"
                className="rounded-2xl border-2 border-surface-200 bg-white px-8 py-4 text-lg font-semibold text-surface-900 hover:bg-surface-50 transition-all"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem — Why Marks Aren't Enough */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-6">
              Marks show the score.
              <br />
              <span className="text-violet-600">But not the gap.</span>
            </h2>
            <p className="text-lg text-surface-600 leading-relaxed">
              A student scores 65% in Science. That tells you the result — not which concept they missed, why they got it wrong, or what they should do next. SANRO closes that gap.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Traditional Testing</h3>
              <p className="text-sm text-surface-600">Students get marks. Teachers get a list. Nobody knows what to fix.</p>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Without Diagnosis</h3>
              <p className="text-sm text-surface-600">Students study everything again. No targeted fix. No measurable improvement.</p>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-card border border-violet-200 text-center ring-2 ring-violet-100">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">With SANRO</h3>
              <p className="text-sm text-surface-600">Assess. Diagnose the exact gap. Fix it. Retest. Prove improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How SANRO Works — 5 Steps */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-4">
              The SANRO Loop
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600 text-lg">
              Five steps. One continuous improvement cycle. Every assessment leads to measurable learning gains.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="relative group">
                <div className="rounded-3xl bg-white p-6 shadow-card border border-surface-100 h-full transition-all group-hover:shadow-card-hover group-hover:-translate-y-1">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${step.bg} mb-4`}>
                    <step.icon className={`h-6 w-6 ${step.text}`} />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-1">
                    Step {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-surface-600 leading-relaxed">{step.description}</p>
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
      <section className="py-24 bg-gradient-to-b from-violet-50/50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 mb-4">
                <BookOpen className="h-3 w-3" />
                FOR STUDENTS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-4">
                What should I do today?
              </h2>
              <p className="text-lg text-surface-600 mb-8 leading-relaxed">
                SANRO tells every student exactly what to work on next. No guessing. No wandering through content. One clear path from weak concept to mastered skill.
              </p>
              <div className="space-y-4">
                {studentJourney.map((item) => (
                  <div key={item.step} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                      <item.icon className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-surface-900">{item.step}</span>
                      <span className="text-surface-500"> — {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-white p-8 shadow-card-elevated border border-surface-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">Student Dashboard</div>
                    <div className="text-xs text-surface-500">Your Focus Today</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-rose-700">Weak Concept</div>
                        <div className="text-xs text-rose-600">Light — Reflection</div>
                      </div>
                      <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Fix This</button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface-50 border border-surface-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-surface-700">Continue Learning</div>
                        <div className="text-xs text-surface-500">Class 10 Science</div>
                      </div>
                      <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">Learn</button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-violet-50 p-3 text-center">
                    <div className="text-lg font-bold text-violet-600">285</div>
                    <div className="text-xs text-violet-500">XP</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 text-center">
                    <div className="text-lg font-bold text-amber-600">5d</div>
                    <div className="text-xs text-amber-500">Streak</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <div className="text-lg font-bold text-emerald-600">72%</div>
                    <div className="text-xs text-emerald-500">Mastery</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Experience */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl bg-white p-8 shadow-card-elevated border border-surface-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-surface-900">Teacher Dashboard</div>
                    <div className="text-xs text-surface-500">Students Needing Attention</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Priya Sharma', concept: 'Quadratic Equations', mastery: 35, status: 'Needs Fix' },
                    { name: 'Rohan Patel', concept: 'Chemical Reactions', mastery: 42, status: 'Needs Fix' },
                    { name: 'Ananya Singh', concept: 'Light — Reflection', mastery: 68, status: 'Developing' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3 rounded-xl bg-surface-50 p-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-surface-900 truncate">{s.name}</div>
                        <div className="text-xs text-surface-500 truncate">{s.concept}</div>
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        s.mastery < 50 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {s.mastery}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 mb-4">
                <Lightbulb className="h-3 w-3" />
                FOR TEACHERS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-4">
                Which students need my attention?
              </h2>
              <p className="text-lg text-surface-600 mb-8 leading-relaxed">
                SANRO gives teachers concept-level visibility into every student. See exactly who is struggling, on what concept, and assign targeted remediation with one click.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {teacherCapabilities.map((cap) => (
                  <div key={cap.title} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                      <cap.icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900 text-sm">{cap.title}</div>
                      <div className="text-xs text-surface-500 mt-0.5">{cap.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School / Institution */}
      <section className="py-24 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
              <Shield className="h-3 w-3" />
              FOR SCHOOLS &amp; INSTITUTIONS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-4">
              How is academic performance across your institution?
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600 text-lg">
              Institution-level dashboards give principals and administrators a clear view of academic health across all classes and subjects.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolFeatures.map((f) => (
              <div key={f.title} className="rounded-3xl bg-white p-6 shadow-card border border-surface-100">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parent */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 mb-4">
                <Heart className="h-3 w-3" />
                FOR PARENTS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-surface-900 mb-4">
                Is my child improving?
              </h2>
              <p className="text-lg text-surface-600 mb-8 leading-relaxed">
                Parents can see their child&apos;s assessment results, concept mastery, weak areas, and — most importantly — measurable improvement over time.
              </p>
              <div className="space-y-4">
                {parentBenefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                      <b.icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-surface-900">{b.title}</div>
                      <div className="text-sm text-surface-500 mt-0.5">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-card-elevated border border-surface-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-surface-900">Child Progress</div>
                  <div className="text-xs text-surface-500">Science — Class 10</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-600">Overall Mastery</span>
                    <span className="font-semibold text-teal-600">72%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: '72%' }} />
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Weak Area: Light — Reflection</span>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">+15% improvement this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
            Start improving student outcomes today.
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Set up SANRO for your school. Assess students, diagnose gaps, and track measurable improvement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-violet-700 hover:bg-violet-50 transition-all shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="rounded-2xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Download */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-surface-50 border border-surface-200 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 mb-4">
                  <Smartphone className="h-3 w-3" />
                  MOBILE APP
                </div>
                <h2 className="text-2xl md:text-3xl font-bold font-display text-surface-900 mb-3">
                  Take SANRO everywhere.
                </h2>
                <p className="text-surface-600 mb-6">
                  Practice, take tests, and fix weak concepts on any device. Built for every learner on every phone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/download"
                    className="inline-flex items-center gap-3 rounded-xl bg-surface-900 px-6 py-3 text-white font-semibold hover:bg-surface-800 transition-all"
                  >
                    <Download className="h-5 w-5" />
                    Download for Android
                  </Link>
                  <span className="inline-flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-6 py-3 text-surface-400 font-semibold cursor-not-allowed" aria-disabled="true" role="button">
                    Coming Soon — iOS
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="rounded-3xl bg-white p-6 shadow-card border border-surface-100 w-full max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="font-semibold text-surface-900">SANRO AI</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-surface-500">XP</span><span className="font-semibold text-violet-600">285</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Streak</span><span className="font-semibold text-amber-600">5 days</span></div>
                    <div className="flex justify-between"><span className="text-surface-500">Mastery</span><span className="font-semibold text-emerald-600">72%</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display text-surface-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl bg-white border border-surface-100 shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-surface-900 list-none">
                  {faq.q}
                  <ChevronRight className="h-5 w-5 text-surface-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 text-sm text-surface-600 leading-relaxed">
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
