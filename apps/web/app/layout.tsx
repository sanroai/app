import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Sanro AI — Academic Assessment, Diagnosis & Remediation',
    template: '%s | Sanro AI',
  },
  description:
    'Sanro AI is an academic intelligence platform for Indian schools. Assess students, diagnose concept-level weaknesses, deliver targeted remediation, and measure improvement. CBSE Classes 1-10, Science & Mathematics.',
  keywords: [
    'Sanro AI',
    'academic assessment',
    'diagnosis',
    'remediation',
    'CBSE',
    'Indian schools',
    'student learning',
    'concept mastery',
    'board exam preparation',
    'Science',
    'Mathematics',
    'Classes 1-10',
  ],
  authors: [{ name: 'Sanro Educare Pvt. Ltd.' }],
  creator: 'Sanro Educare Pvt. Ltd.',
  publisher: 'Sanro Educare Pvt. Ltd.',
  metadataBase: new URL('https://sanroai.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://sanroai.com',
    siteName: 'Sanro AI',
    title: 'Sanro AI — Academic Assessment, Diagnosis & Remediation',
    description:
      'Assess students, diagnose concept-level weaknesses, deliver targeted remediation, and measure improvement. CBSE Classes 1-10.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sanro AI — Academic Assessment, Diagnosis & Remediation',
    description:
      'Assess students, diagnose concept-level weaknesses, deliver targeted remediation, and measure improvement.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('sanro-theme');
                if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              } catch(e) {}
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
