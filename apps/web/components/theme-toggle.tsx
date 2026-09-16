'use client';

import { useTheme } from '@/lib/use-theme';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className={cn('flex items-center gap-1 rounded-xl bg-surface-100 dark:bg-surface-800 p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
            theme === opt.value
              ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
              : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
          )}
          title={opt.label}
        >
          <opt.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
