import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/features', label: 'Features' },
  { href: '/for-schools', label: 'For Schools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

const footerSections = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/download', label: 'Download App' },
    ],
  },
  {
    title: 'Audience',
    links: [
      { href: '/for-students', label: 'For Students' },
      { href: '/for-teachers', label: 'For Teachers' },
      { href: '/for-schools', label: 'For Schools' },
      { href: '/for-parents', label: 'For Parents' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Sanro AI' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms & Conditions' },
    ],
  },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-200/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-surface-900">Sanro AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-surface-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-surface-900">Sanro AI</span>
              </Link>
              <p className="text-sm text-surface-500 max-w-xs">
                Academic assessment, diagnosis &amp; remediation platform for Indian schools.
              </p>
            </div>
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-surface-900 mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-surface-500 hover:text-surface-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-surface-400">
              &copy; {new Date().getFullYear()} Sanro Educare Pvt. Ltd. All rights reserved.
            </p>
            <p className="text-sm text-surface-400">
              CBSE Board &middot; Classes 1&ndash;10 &middot; Science &amp; Mathematics
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
