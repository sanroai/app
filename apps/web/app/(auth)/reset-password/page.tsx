'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useState } from 'react';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type ResetPassword = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-surface-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPassword>({ resolver: zodResolver(ResetPasswordSchema) });

  async function onSubmit(values: ResetPassword) {
    setServerError(null);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password: values.password },
      });
      setDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Failed to reset password');
    }
  }

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Invalid reset link</h1>
        <p className="text-surface-600">
          This password reset link is missing its token. Please request a new one.
        </p>
        <Button variant="outline" onClick={() => router.push('/forgot-password')}>
          <ArrowLeft className="h-4 w-4" />
          Request new link
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Password updated</h1>
        <p className="text-surface-600">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Button onClick={() => router.push('/login')}>Go to sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900">Set a new password</h1>
        <p className="mt-2 text-surface-600">Choose a strong password with at least 8 characters</p>
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-surface-700">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="pl-10 pr-10"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-surface-700">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="pl-10 pr-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Reset password'}
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
