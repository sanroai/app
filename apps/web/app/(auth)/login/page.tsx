'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { LoginSchema, type Login } from '@sanro/validation';
import { useAuthStore, type LoginResponse } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import {
  isBlockedCode,
  isBlockedResponseBody,
  toBlockedState,
  blockedRoute,
} from '@/lib/blocked-state';
import type { BlockedAccountResponse } from '@sanro/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const setBlocked = useAuthStore((s) => s.setBlocked);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(values: Login) {
    setServerError(null);
    try {
      const payload = await api<LoginResponse | BlockedAccountResponse>('/auth/login', {
        method: 'POST',
        body: values,
      });
      if (isBlockedResponseBody(payload)) {
        const bs = toBlockedState(payload);
        setBlocked(bs);
        router.replace(blockedRoute(bs));
        return;
      }
      setSession(payload as LoginResponse);
      router.push('/app');
    } catch (e) {
      if (e instanceof ApiError && isBlockedCode(e.code)) {
        const state = useAuthStore.getState().blocked;
        router.replace(state ? blockedRoute(state) : `/app/account-blocked?state=${encodeURIComponent(e.code)}`);
        return;
      }
      setServerError(e instanceof Error ? e.message : 'Login failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Home
        </Link>
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-4">
          <GraduationCap className="h-4 w-4" />
          Welcome back!
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Sign in to Sanro AI</h1>
        <p className="mt-2 text-surface-600">
          Enter your credentials to continue learning
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
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-surface-700">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div role="status" className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="sr-only">Loading...</span>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-surface-500">or</span>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-surface-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-surface-600">
            New to Sanro AI?{' '}
            <Link
              href="/register"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Create an institution account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}