'use client';

import { cn } from '@/lib/cn';
import type { SuperAdminRange } from '@/lib/super-admin-hooks';

export const SUPER_ADMIN_RANGES: { value: SuperAdminRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'month', label: 'This Month' },
];

export function TimeRangeSelect({
  value,
  onChange,
}: {
  value: SuperAdminRange;
  onChange: (value: SuperAdminRange) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-surface-100 p-1">
      {SUPER_ADMIN_RANGES.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all',
            value === option.value
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-surface-500 hover:text-surface-900',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}