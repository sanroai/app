import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sanro AI',
  description: 'Sanro AI privacy policy. How we collect, use, and protect your data.',
  openGraph: {
    title: 'Privacy Policy — Sanro AI',
    description: 'How Sanro AI handles your data.',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <main className="pt-28 pb-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-surface-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-surface-500 mb-10">Last updated: September 2026</p>

        <div className="prose prose-surface max-w-none space-y-8 text-surface-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">1. Introduction</h2>
            <p>
              Sanro Educare Pvt. Ltd. (&quot;Sanro AI&quot;, &quot;we&quot;, &quot;us&quot;) operates
              the Sanro AI platform for academic assessment, diagnosis, and remediation. This
              Privacy Policy explains how we collect, use, and protect information when you use
              our website, mobile application, and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address, phone number, and role
                (student, teacher, parent, admin).
              </li>
              <li>
                <strong>Institution Data:</strong> School name, class assignments, and subject
                allocations.
              </li>
              <li>
                <strong>Learning Data:</strong> Assessment responses, concept mastery levels,
                practice session results, remediation progress, and gamification data (XP,
                streaks, badges).
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, session duration, and
                interaction patterns.
              </li>
              <li>
                <strong>Device Data:</strong> Device type, operating system, browser type, and
                IP address.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and improve the Sanro AI platform.</li>
              <li>To generate concept-level diagnosis and remediation plans.</li>
              <li>To provide dashboards and reports for students, teachers, parents, and admins.</li>
              <li>To send notifications about assessments, remediation, and achievements.</li>
              <li>To ensure platform security and prevent misuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only within the platform to
              support the educational workflow (e.g., a teacher sees their students&apos; mastery
              data, a parent sees their child&apos;s progress). We may share anonymized,
              aggregated data for research or product improvement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">5. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data, including
              encryption in transit (TLS) and at rest, access controls, and regular security
              audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide
              services. You may request deletion of your account and associated data by contacting
              us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access your personal data.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Export your data in a portable format.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Sanro AI is designed for students under 18. We collect data with the consent of the
              student&apos;s parent or guardian and the institution. We do not knowingly collect
              data from children without appropriate consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes through the platform or by email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-surface-900 mb-3">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{' '}
              <a href="mailto:hello@sanroai.com" className="text-brand-600 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
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
