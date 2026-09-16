import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Sanro AI',
  description: 'Sanro AI terms and conditions. Rules for using the Sanro AI platform.',
  openGraph: {
    title: 'Terms & Conditions — Sanro AI',
    description: 'Rules for using Sanro AI.',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <main className="pt-28 pb-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-surface-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-surface-500 mb-10">Last updated: September 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Sanro AI platform (website, mobile application, and
              services), you agree to be bound by these Terms &amp; Conditions. If you do not
              agree, do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">2. Description of Service</h2>
            <p>
              Sanro AI is an academic assessment, diagnosis, and remediation platform for Indian
              schools. It provides assessments, concept-level diagnosis, targeted remediation,
              retesting, progress tracking, and related educational tools for CBSE Classes 1-10
              in Science and Mathematics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>One person may not maintain more than one account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the platform for any unlawful purpose.</li>
              <li>Attempt to access other users&apos; accounts or data.</li>
              <li>Interfere with or disrupt the platform&apos;s operation.</li>
              <li>Upload malicious content or code.</li>
              <li>Use automated tools to access the platform without permission.</li>
              <li>Share your account credentials with others.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Sanro AI platform — including text,
              graphics, logos, icons, images, data, and software — are the property of Sanro
              Educare Pvt. Ltd. and are protected by Indian and international copyright,
              trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">6. Content Accuracy</h2>
            <p>
              Sanro AI strives to provide accurate academic content aligned with CBSE curriculum.
              However, we do not guarantee that all content is error-free or complete. Users
              should verify critical academic information with official sources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Sanro AI shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from
              your use of the platform. Our total liability shall not exceed the amount paid
              by you to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">8. Termination</h2>
            <p>
              We may suspend or terminate your access to the platform at any time, with or
              without cause, with or without notice. Upon termination, your right to use the
              platform ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be resolved in
              the courts of Pune, Maharashtra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of
              significant changes through the platform or by email. Continued use after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">11. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:hello@sanroai.com" className="text-brand-600 hover:underline">
                hello@sanroai.com
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
