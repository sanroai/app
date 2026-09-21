'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';

const ForgotPasswordSchema = z.object({ email: z.string().email('Enter a valid email') });
type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPassword>({ resolver: zodResolver(ForgotPasswordSchema) });

  const [sentEmail, setSentEmail] = useState('');

  async function onSubmit(values: ForgotPassword) {
    setServerError(null);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: values });
      setSentEmail(values.email);
      setSent(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to send reset email');
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Check your email</h1>
        <p className="text-surface-600">
          If an account exists with <strong>{sentEmail}</strong>, we&apos;ve sent password reset instructions.
        </p>
        <Button variant="outline" onClick={() => router.push('/login')}>
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900">Reset your password</h1>
        <p className="mt-2 text-surface-600">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-surface-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@school.edu"
                  className="pl-10"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft className="inline h-4 w-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
