'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export type ChatReply = {
  reply: string;
  grounded: boolean;
  sources: string[];
};

export function useChat() {
  const token = useAuthStore((s) => s.token);
  return useMutation({
    mutationFn: (data: {
      message: string;
      context?: { conceptId?: string; questionId?: string; assessmentId?: string; chapterId?: string };
    }) => api<ChatReply>('/chat/ask-sanro', { method: 'POST', token, body: data }),
  });
}
