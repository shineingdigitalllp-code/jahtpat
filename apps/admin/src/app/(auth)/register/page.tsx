'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2 } from 'lucide-react';
import { adminRegisterSchema, type AdminRegisterInput } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Alert } from '@/components/ui/Alert';

export default function RegisterPage() {
  const router = useRouter();
  const { refetchAdmin } = useAdmin();
  const [isSubmittedSuccess, setIsSubmittedSuccess] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: setupStatus, isLoading: isSetupLoading } = useQuery<{ needsSetup: boolean }>({
    queryKey: ['admin', 'setup-status'],
    queryFn: () => apiFetch<{ needsSetup: boolean }>('/api/v1/admin/auth/setup-status'),
  });

  const isSetupMode = setupStatus?.needsSetup ?? false;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterInput>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';
  const hasMinLength = passwordValue.length >= 10;
  const hasLetter = /[A-Za-z]/.test(passwordValue);
  const hasNumber = /\d/.test(passwordValue);

  const onSubmit = async (data: AdminRegisterInput) => {
    setFormError(null);
    try {
      const res = await apiFetch<any>('/api/v1/admin/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (isSetupMode) {
        await refetchAdmin();
        router.replace('/dashboard');
      } else {
        setIsSubmittedSuccess(true);
      }
    } catch (err: any) {
      if (err?.details?.email) {
        setError('email', { message: err.details.email[0] || 'An account with this email already exists' });
      } else if (err?.code === 'RATE_LIMITED') {
        setFormError(err.message || 'Too many attempts. Please try again later.');
      } else {
        setFormError(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="w-full max-w-[400px] rounded-[14px] border border-border bg-surface p-8 text-ink">
      {/* Brand & Wordmark */}
      <div className="mb-6 text-center">
        <span className="font-serif text-[26px] font-bold text-accent leading-none">
          jhatpat
        </span>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted mt-1">
          Admin Portal
        </div>
      </div>

      {isSubmittedSuccess ? (
        <div className="py-4 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tone-success-bg)] text-[var(--tone-success-text)]">
            <CheckCircle2 className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-ink">Request sent</h2>
            <p className="text-xs text-muted leading-relaxed">
              An owner has to approve your account before you can sign in.
            </p>
          </div>
          <Button asChild className="w-full mt-4">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-ink tracking-tight">
              {isSetupMode ? 'Create the owner account' : 'Request access'}
            </h1>
            <p className="mt-1 text-xs text-muted">
              {isSetupMode
                ? 'This account will manage the whole store.'
                : 'Create an account to request administrative access.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && <Alert variant="danger">{formError}</Alert>}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Full Name</label>
              <Input
                {...register('name')}
                placeholder="Amit Sharma"
                autoFocus
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-[11px] text-[var(--tone-danger-text)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Email</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="admin@jhatpat.in"
                error={!!errors.email}
              />
              {errors.email && (
                <p className="text-[11px] text-[var(--tone-danger-text)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Password</label>
              <PasswordInput
                {...register('password')}
                placeholder="Create a strong password"
                error={!!errors.password}
              />

              {/* Password checklist */}
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

              {errors.password && (
                <p className="text-[11px] text-[var(--tone-danger-text)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Confirm Password</label>
              <PasswordInput
                {...register('confirmPassword')}
                placeholder="Confirm password"
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-[var(--tone-danger-text)]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={isSubmitting || isSetupLoading}
              className="w-full mt-2"
            >
              {isSetupMode ? 'Create owner account' : 'Request access'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

