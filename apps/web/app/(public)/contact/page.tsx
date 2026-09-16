import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact — Sanro AI',
  description:
    'Get in touch with Sanro AI. Request a demo, ask questions, or tell us about your school.',
  openGraph: {
    title: 'Contact Sanro AI',
    description: 'Get in touch with Sanro AI.',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <main className="pt-28 pb-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-6">
            Contact
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-surface-900 mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-surface-600">
            Have questions about Sanro AI? Want a demo for your school? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form */}
          <div className="rounded-3xl bg-white p-8 shadow-card border border-surface-100">
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-surface-900 mb-4">Contact Information</h2>
              <p className="text-surface-600">
                Reach out to us directly. We typically respond within one business day.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <Mail className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-900">Email</div>
                  <div className="text-sm text-surface-600">hello@sanroai.com</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <Phone className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-900">Phone</div>
                  <div className="text-sm text-surface-600">+91 98765 43210</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                  <MapPin className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-900">Office</div>
                  <div className="text-sm text-surface-600">
                    Sanro Educare Pvt. Ltd.<br />
                    Pune, Maharashtra, India
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-surface-50 p-6 border border-surface-100">
              <h3 className="text-sm font-semibold text-surface-900 mb-2">Request a Demo</h3>
              <p className="text-sm text-surface-600">
                Want to see Sanro AI in action for your school? Fill out the form and mention
                &quot;demo request&quot; in your message. We&apos;ll set up a walkthrough for your team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
