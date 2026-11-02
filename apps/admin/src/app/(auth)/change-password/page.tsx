'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { adminChangePasswordSchema, type AdminChangePasswordInput } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Alert } from '@/components/ui/Alert';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { admin, refetchAdmin } = useAdmin();
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminChangePasswordInput>({
    resolver: zodResolver(adminChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword') || '';
  const hasMinLength = newPassword.length >= 10;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const onSubmit = async (data: AdminChangePasswordInput) => {
    setFormError(null);
    try {
      await apiFetch('/api/v1/admin/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refetchAdmin();
      router.replace('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password');
    }
  };

  return (
    <div className="w-full max-w-[400px] rounded-[14px] border border-border bg-surface p-8 text-ink">
      <div className="mb-6 text-center">
        <span className="font-serif text-[26px] font-bold text-accent leading-none">
          jhatpat
        </span>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-1">
          Admin Portal
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink tracking-tight">Set a new password</h1>
        <p className="mt-1 text-xs text-muted">
          Your account requires a password change before continuing.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formError && <Alert variant="danger">{formError}</Alert>}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink">Current (Temporary) Password</label>
          <PasswordInput
            {...register('currentPassword')}
            placeholder="Enter temporary password"
            autoFocus
            error={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <p className="text-[11px] text-[var(--tone-danger-text)]">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink">New Password</label>
          <PasswordInput
            {...register('newPassword')}
            placeholder="Create new password"
            error={!!errors.newPassword}
          />

          <div className="pt-1.5 space-y-1 text-xs">
            <div
              className={`flex items-center gap-1.5 ${
                hasMinLength ? 'text-[var(--tone-success-text)]' : 'text-muted'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>At least 10 characters</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasLetter ? 'text-[var(--tone-success-text)]' : 'text-muted'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>At least one letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                hasNumber ? 'text-[var(--tone-success-text)]' : 'text-muted'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>At least one number</span>
            </div>
          </div>

          {errors.newPassword && (
            <p className="text-[11px] text-[var(--tone-danger-text)]">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink">Confirm New Password</label>
          <PasswordInput
            {...register('confirmPassword')}
            placeholder="Confirm new password"
            error={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-[11px] text-[var(--tone-danger-text)]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full mt-2">
          Update password & continue
        </Button>
      </form>
    </div>
  );
}

