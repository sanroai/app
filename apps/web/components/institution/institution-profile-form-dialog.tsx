'use client';

import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { InstitutionType, type InstitutionDetail } from '@sanro/types';
import { useUpdateInstitution } from '@/lib/institution-hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const InstitutionProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  type: z.enum(Object.values(InstitutionType) as [string, ...string[]], {
    message: 'Select an institution type',
  }),
  code: z.string().trim().max(20, 'Code must be at most 20 characters').optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),
  website: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  contactPerson: z.string().trim().max(200).optional().or(z.literal('')),
  primaryPhone: z.string().trim().max(20).optional().or(z.literal('')),
  primaryEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  seatLimit: z.coerce.number().int().positive('Seat limit must be a positive number').optional().or(z.literal('')),
  gracePeriodDays: z.coerce.number().int().min(0, 'Grace period cannot be negative').max(3650).optional().or(z.literal('')),
});

type InstitutionProfileForm = z.infer<typeof InstitutionProfileSchema>;

const INSTITUTION_TYPE_OPTIONS = Object.values(InstitutionType);

interface InstitutionProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionDetail;
}

export function InstitutionProfileFormDialog({
  open,
  onOpenChange,
  institution,
}: InstitutionProfileFormDialogProps) {
  const update = useUpdateInstitution(institution.id);

  const defaultValues = useMemo<InstitutionProfileForm>(
    () => ({
      name: institution.name ?? '',
      type: institution.type ?? InstitutionType.SCHOOL,
      code: institution.code ?? '',
      address: institution.address ?? '',
      city: institution.city ?? '',
      state: institution.state ?? '',
      country: institution.country ?? '',
      website: institution.website ?? '',
      contactPerson: institution.contactPerson ?? '',
      primaryPhone: institution.primaryPhone ?? '',
      primaryEmail: institution.primaryEmail ?? '',
      seatLimit: institution.seatLimit ?? '',
      gracePeriodDays: institution.gracePeriodDays ?? '',
    }),
    [institution],
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionProfileForm>({
    resolver: zodResolver(InstitutionProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  function onSubmit(values: InstitutionProfileForm) {
    update.mutate(
      {
        name: values.name,
        type: values.type,
        code: values.code || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        country: values.country || undefined,
        website: values.website || undefined,
        contactPerson: values.contactPerson || undefined,
        primaryPhone: values.primaryPhone || undefined,
        primaryEmail: values.primaryEmail || undefined,
        seatLimit: values.seatLimit ? Number(values.seatLimit) : undefined,
        gracePeriodDays: values.gracePeriodDays ? Number(values.gracePeriodDays) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Institution profile updated');
          onOpenChange(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Institution</DialogTitle>
          <DialogDescription>
            Update the institution&apos;s profile details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. Sunrise Public School" {...register('name')} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTITUTION_TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="e.g. SUN002" {...register('code')} />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://..." {...register('website')} />
              {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Street address" {...register('address')} />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="State" {...register('state')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="Country" {...register('country')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input id="contactPerson" placeholder="Principal name" {...register('contactPerson')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryPhone">Primary Phone</Label>
              <Input id="primaryPhone" placeholder="+91..." {...register('primaryPhone')} />
              {errors.primaryPhone && <p className="text-sm text-red-500">{errors.primaryPhone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryEmail">Primary Email</Label>
            <Input id="primaryEmail" type="email" placeholder="office@school.com" {...register('primaryEmail')} />
            {errors.primaryEmail && <p className="text-sm text-red-500">{errors.primaryEmail.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seatLimit">Seat Limit</Label>
              <Input id="seatLimit" type="number" min={1} placeholder="e.g. 500" {...register('seatLimit')} />
              {errors.seatLimit && <p className="text-sm text-red-500">{errors.seatLimit.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
              <Input id="gracePeriodDays" type="number" min={0} max={3650} placeholder="e.g. 30" {...register('gracePeriodDays')} />
              {errors.gracePeriodDays && <p className="text-sm text-red-500">{errors.gracePeriodDays.message}</p>}
            </div>
          </div>

          {(update.isError || update.isSuccess) && update.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {(update.error as Error).message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {isSubmitting || update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}