'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * Copy text, working even when `navigator.clipboard` is unavailable.
 *
 * The Clipboard API only exists in a secure context, so a school running the app
 * over plain http (or a browser that blocks it) would otherwise get a dead button.
 * The `textarea` + `execCommand` path is the documented fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

type State = 'idle' | 'copied' | 'failed';

export function CopyTextButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
  disabled,
}: {
  text?: string | null;
  label?: string;
  copiedLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const hasText = Boolean(text && text.trim());

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!hasText || disabled}
      onClick={async () => {
        const ok = await copyToClipboard(text ?? '');
        setState(ok ? 'copied' : 'failed');
      }}
      aria-label={state === 'copied' ? copiedLabel : label}
      className={cn('shrink-0 rounded-xl', className)}
    >
      {state === 'copied' ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : state === 'failed' ? (
        <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {state === 'copied' ? copiedLabel : state === 'failed' ? 'Select the text' : label}
    </Button>
  );
}
