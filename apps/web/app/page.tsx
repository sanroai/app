import Link from 'next/link';
import { 
  GraduationCap, 
  Brain, 
  Trophy, 
  BookOpen, 
  Users, 
  ArrowRight,
  Star,
  Zap,
  Target,
  Smartphone,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Personalised study plans and adaptive quizzes that adjust to each student\'s pace.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Trophy,
    title: 'Gamification',
    description: 'XP points, badges, streaks, and leaderboards that keep students motivated.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Target,
    title: 'Smart Diagnosis',
    description: 'Pinpoint weak concepts and get targeted remediation plans.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: BookOpen,
    title: 'Question Bank',
    description: 'Thousands of board-mapped questions with AI-generated papers.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Multi-Role',
    description: 'Dedicated dashboards for students, teachers, parents, and admins.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Learn anywhere with our responsive web app and native mobile apps.',
    color: 'from-violet-500 to-purple-500',
  },
];

const stats = [
  { value: '5000+', label: 'Video Lessons' },
  { value: '100%', label: 'Board Mapped' },
  { value: '5★', label: 'Student Rating' },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Principal, Delhi Public School',
    content: 'Sanro AI has transformed how our students learn. The AR models make science come alive!',
    rating: 5,
  },
  {
    name: 'Rajesh Kumar',
    role: 'Parent',
    content: 'My daughter\'s math scores improved by 40% in just 3 months. The gamification keeps her engaged.',
    rating: 5,
  },
  {
    name: 'Anita Desai',
    role: 'Teacher, St. Mary\'s School',
    content: 'The question paper generator saves me hours every week. Brilliant tool!',
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-900">Sanro AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25 hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-200/30 blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
              <Zap className="h-4 w-4" />
              India's First AI + AR Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-surface-900 mb-6 leading-tight">
              Learn With{' '}
              <span className="gradient-text">Fun!</span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-surface-600 mb-10">
              Where every student sees learning come alive. AI-powered personalised education 
              with gamification, AR models, and smart analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white hover:from-brand-700 hover:to-purple-700 transition-all shadow-xl shadow-brand-600/30 hover:shadow-2xl hover:shadow-brand-600/40 flex items-center gap-2"
              >
                Start Learning
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border-2 border-surface-200 bg-white px-8 py-4 text-lg font-semibold text-surface-900 hover:bg-surface-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-brand-600">{stat.value}</div>
                <div className="text-sm text-surface-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Excel</span>
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600">
              From AI-powered diagnostics to gamified learning, we've got every aspect of education covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-3xl bg-white p-8 shadow-card hover:shadow-card-hover transition-all border border-surface-100"
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} mb-6`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3">{feature.title}</h3>
                <p className="text-surface-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Simple,{' '}
              <span className="gradient-text">Affordable</span>{' '}
              Pricing
            </h2>
            <p className="mx-auto max-w-2xl text-surface-600">
              Plans designed for every school in India. Less than a cup of chai per student per month.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100">
              <div className="text-sm font-semibold text-surface-500 mb-2">School Starter</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-surface-900">₹499</span>
                <span className="text-surface-500">/student/yr</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Board-mapped videos
                </li>
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Quizzes & assessments
                </li>
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Teacher dashboard
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl border-2 border-surface-200 bg-white py-3 text-center font-semibold text-surface-900 hover:bg-surface-50 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative rounded-3xl bg-gradient-to-br from-brand-600 to-purple-600 p-8 shadow-xl text-white scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-surface-900">
                Most Popular
              </div>
              <div className="text-sm font-semibold text-white/80 mb-2">School Pro</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">₹799</span>
                <span className="text-white/80">/student/yr</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-white/90">
                  <Star className="h-4 w-4 text-amber-300" />
                  Everything in Starter
                </li>
                <li className="flex items-center gap-2 text-sm text-white/90">
                  <Star className="h-4 w-4 text-amber-300" />
                  AR 3D Models
                </li>
                <li className="flex items-center gap-2 text-sm text-white/90">
                  <Star className="h-4 w-4 text-amber-300" />
                  AI Tutor 24/7
                </li>
                <li className="flex items-center gap-2 text-sm text-white/90">
                  <Star className="h-4 w-4 text-amber-300" />
                  Gamification + Parent Portal
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl bg-white py-3 text-center font-semibold text-brand-700 hover:bg-brand-50 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100">
              <div className="text-sm font-semibold text-surface-500 mb-2">School Enterprise</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-surface-900">₹1,100</span>
                <span className="text-surface-500">/student/yr</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  White-label branding
                </li>
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Priority SLA
                </li>
                <li className="flex items-center gap-2 text-sm text-surface-600">
                  <Star className="h-4 w-4 text-amber-500" />
                  Custom integrations
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full rounded-xl border-2 border-surface-200 bg-white py-3 text-center font-semibold text-surface-900 hover:bg-surface-50 transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">
              Loved by{' '}
              <span className="gradient-text">Schools</span>{' '}
              Across India
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl bg-white p-8 shadow-card border border-surface-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-surface-600 mb-6">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-surface-900">{testimonial.name}</div>
                  <div className="text-sm text-surface-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            </div>
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Learning?
              </h2>
              <p className="mx-auto max-w-2xl text-white/80 mb-8">
                Join 1000+ schools already using Sanro AI. Start your free 30-day trial today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-brand-50 transition-all shadow-xl"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-surface-900">Sanro AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-500">
              <a href="#" className="hover:text-surface-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-surface-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-surface-900 transition-colors">Contact</a>
            </div>
            <div className="text-sm text-surface-500">
              © 2026 Sanro Educare Pvt. Ltd. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}