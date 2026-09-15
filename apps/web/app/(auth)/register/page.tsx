'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { RegisterInstitutionSchema, type RegisterInstitution } from '@sanro/validation';
import { useAuthStore, type LoginResponse } from '@/lib/auth-store';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight,
  GraduationCap,
  BookOpen
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInstitution>({
    resolver: zodResolver(RegisterInstitutionSchema),
    defaultValues: { institutionType: 'SCHOOL' },
  });

  const institutionType = watch('institutionType');

  async function onSubmit(values: RegisterInstitution) {
    setServerError(null);
    try {
      const payload = await api<LoginResponse>('/auth/register-institution', {
        method: 'POST',
        body: values,
      });
      setSession(payload);
      router.push('/app');
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Registration failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 mb-4">
          <GraduationCap className="h-4 w-4" />
          Get Started
        </div>
        <h1 className="text-3xl font-bold text-surface-900">Register your institution</h1>
        <p className="mt-2 text-surface-600">
          Create an account and start transforming education today
        </p>
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName" className="text-surface-700">Institution name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="institutionName"
                  placeholder="Sunrise Public School"
                  className="pl-10"
                  {...register('institutionName')}
                />
              </div>
              {errors.institutionName && (
                <p className="text-sm text-red-500">{errors.institutionName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-surface-700">Institution type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('institutionType', 'SCHOOL')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    institutionType === 'SCHOOL'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-medium">School</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('institutionType', 'COACHING_CENTRE')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    institutionType === 'COACHING_CENTRE'
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">Coaching Centre</span>
                </button>
              </div>
              <input type="hidden" {...register('institutionType')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminName" className="text-surface-700">Admin name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="adminName"
                  autoComplete="name"
                  placeholder="Asha Kulkarni"
                  className="pl-10"
                  {...register('adminName')}
                />
              </div>
              {errors.adminName && (
                <p className="text-sm text-red-500">{errors.adminName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-surface-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="adminEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="asha@school.edu"
                  className="pl-10"
                  {...register('adminEmail')}
                />
              </div>
              {errors.adminEmail && (
                <p className="text-sm text-red-500">{errors.adminEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone" className="text-surface-700">Phone (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="adminPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className="pl-10"
                  {...register('adminPhone')}
                />
              </div>
              {errors.adminPhone && (
                <p className="text-sm text-red-500">{errors.adminPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-surface-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <Input
                  id="adminPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className="pl-10"
                  {...register('adminPassword')}
                />
              </div>
              {errors.adminPassword && (
                <p className="text-sm text-red-500">{errors.adminPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
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
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create institution
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
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Sign in to your account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}