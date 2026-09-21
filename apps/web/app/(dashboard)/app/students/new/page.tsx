'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

const CreateStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  grade: z.string().min(1, 'Grade is required'),
});
type CreateStudent = z.infer<typeof CreateStudentSchema>;

export default function NewStudentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudent>({ resolver: zodResolver(CreateStudentSchema) });

  const createStudent = useMutation({
    mutationFn: (data: CreateStudent) =>
      api('/students', {
        method: 'POST',
        body: {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          grade: data.grade,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      router.push('/app/students');
    },
    onError: (e: Error) => setServerError(e.message),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Add Student</h1>
          <p className="text-surface-500 text-sm">Create a new student account</p>
        </div>
      </div>

      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit((data) => createStudent.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="e.g. Aarav Sharma" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="student@example.com" {...register('email')} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="9876543210" {...register('phone')} />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Input id="grade" placeholder="e.g. 10" {...register('grade')} />
              {errors.grade && <p className="text-sm text-red-500">{errors.grade.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Student
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
