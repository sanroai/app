'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

const components = {
  h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-6 mb-3 text-xl font-bold text-surface-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-5 mb-2 text-lg font-bold text-surface-900 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-4 mb-2 text-base font-semibold text-surface-800 first:mt-0">{children}</h3>
  ),
  h4: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="mt-3 mb-1.5 text-sm font-semibold text-surface-800 first:mt-0">{children}</h4>
  ),
  p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 text-sm leading-relaxed text-surface-700 last:mb-0">{children}</p>
  ),
  a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
    >
      {children}
    </a>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-surface-900">{children}</strong>
  ),
  em: ({ children }: React.HTMLAttributes<HTMLElement>) => <em className="italic">{children}</em>,
  ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-surface-700">{children}</ul>
  ),
  ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-surface-700">{children}</ol>
  ),
  li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mb-3 rounded-r-lg border-l-4 border-brand-200 bg-brand-50/50 px-4 py-2 text-sm text-surface-700">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: React.HTMLAttributes<HTMLElement>) => {
    const isBlock = /language-/.test(className ?? '');
    if (isBlock) {
      return (
        <code className={cn('block overflow-x-auto rounded-lg bg-surface-900 p-3 text-xs text-surface-100', className)}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-xs text-surface-800">{children}</code>
    );
  },
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => <pre className="mb-3 overflow-x-auto">{children}</pre>,
  table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-surface-200">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-surface-50">{children}</thead>
  ),
  th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="border-b border-surface-200 px-3 py-2 text-left font-semibold text-surface-800">{children}</th>
  ),
  td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b border-surface-100 px-3 py-2 align-top text-surface-700 last:border-b-0">{children}</td>
  ),
  hr: () => <hr className="my-4 border-surface-200" />,
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} className="my-3 max-w-full rounded-lg" />
  ),
};

export function Markdown({ children, className }: { children?: string | null; className?: string }) {
  if (!children || !children.trim()) return null;
  return (
    <div className={cn('sanro-markdown', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
