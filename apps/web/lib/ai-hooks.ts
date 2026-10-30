'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type ChatReply = {
  reply: string;
  grounded: boolean;
  sources: string[];
  /** The model hit its output cap; `reply` already carries the shortened marker. */
  truncated?: boolean;
};

export function useChat() {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: { conceptId?: string; questionId?: string; assessmentId?: string; chapterId?: string };
    }) => api<ChatReply>('/chat/ask-sanro', { method: 'POST', token, body: data }),
  });
}
