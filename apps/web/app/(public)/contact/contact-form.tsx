'use client';

export function ContactForm() {
  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-surface-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          required
          className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-surface-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium text-surface-700">
          I am a
        </label>
        <select
          id="role"
          className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        >
          <option>Teacher</option>
          <option>School Administrator</option>
          <option>Parent</option>
          <option>Student</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-surface-700">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          required
          className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
          placeholder="Tell us about your school or question..."
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/25"
      >
        Send Message
      </button>
    </form>
  );
}
