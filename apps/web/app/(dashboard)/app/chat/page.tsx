'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/lib/ai-hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, Brain, Loader2 } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTED_QUESTIONS = [
  'Explain this concept',
  'Give me a practice problem',
  'What am I weak in?',
  'How do I improve my score?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Sanro AI Tutor. Ask me anything about your studies — concepts, practice problems, or tips to improve.",
      timestamp: new Date(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChat();
  const searchParams = useSearchParams();
  const conceptId = searchParams.get('conceptId') ?? undefined;
  const prefill = searchParams.get('q') ?? '';
  const autoSentRef = useRef(false);

  const [input, setInput] = useState(prefill);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (prefill && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSend(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || chatMutation.isPending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    chatMutation.mutate(
      { message, context: conceptId ? { conceptId } : undefined },
      {
        onSuccess: (data) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: data.reply,
              timestamp: new Date(),
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content: 'Sorry, something went wrong. Please try again.',
              timestamp: new Date(),
            },
          ]);
        },
      },
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
          <Brain className="h-6 w-6 text-brand-500" />
          Ask SANRO
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          Get instant help with concepts, practice problems, and study tips
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1">
            <div ref={scrollRef} role="log" aria-live="polite" className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-tr-sm'
                          : 'bg-surface-100 text-surface-900 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-surface-100 px-4 py-3">
                      <Loader2 className="h-4 w-4 text-surface-400 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-surface-200 p-4">
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => handleSend(q)}
                    disabled={chatMutation.isPending}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                aria-label="Type your question"
                className="flex-1"
                disabled={chatMutation.isPending}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send message"
                disabled={!input.trim() || chatMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
