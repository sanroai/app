import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 via-white to-purple-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-surface-900">404</h1>
        <p className="mt-4 text-lg text-surface-600">Page not found</p>
        <p className="mt-2 text-surface-500">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-all"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}