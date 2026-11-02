'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { adminLoginSchema, type AdminLoginInput } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/dashboard';
  const { admin, isLoading: isAuthLoading, refetchAdmin } = useAdmin();

  const [formError, setFormError] = React.useState<string | null>(null);

  const { data: setupStatus, isLoading: isSetupLoading } = useQuery<{ needsSetup: boolean }>({
    queryKey: ['admin', 'setup-status'],
    queryFn: () => apiFetch<{ needsSetup: boolean }>('/api/v1/admin/auth/setup-status'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const remember = watch('remember');

  React.useEffect(() => {
    if (!isAuthLoading && admin) {
      router.replace(nextUrl);
    }
  }, [admin, isAuthLoading, nextUrl, router]);

  const onSubmit = async (data: AdminLoginInput) => {
    setFormError(null);
    try {
      await apiFetch('/api/v1/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refetchAdmin();
      router.replace(nextUrl);
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_PENDING') {
        setFormError('Your account is waiting for approval by an owner.');
      } else if (err?.code === 'ACCOUNT_SUSPENDED') {
        setFormError('Your account has been suspended.');
      } else if (err?.code === 'RATE_LIMITED') {
        setFormError(err.message || 'Too many attempts, try again later.');
      } else {
        setFormError(err.message || 'Invalid email or password');
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

      {setupStatus?.needsSetup ? (
        <div className="space-y-4">
          <Alert variant="info" title="No admin exists yet">
            Setup mode is active. Create the initial store owner account to get started.
          </Alert>
          <Button asChild className="w-full">
            <Link href="/register">Create owner account</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-ink tracking-tight">Sign in</h1>
            <p className="mt-1 text-xs text-muted">Use your admin account to continue.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && <Alert variant="danger">{formError}</Alert>}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Email</label>
              <Input
                {...register('email')}
                type="email"
                placeholder="admin@jhatpat.in"
                autoFocus
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
                placeholder="••••••••••"
                error={!!errors.password}
              />
              {errors.password && (
                <p className="text-[11px] text-[var(--tone-danger-text)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setValue('remember', Boolean(checked))}
              />
              <label
                htmlFor="remember"
                className="text-xs text-muted cursor-pointer select-none"
              >
                Keep me signed in for 30 days
              </label>
            </div>

            <Button
              type="submit"
              loading={isSubmitting || isSetupLoading}
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            Need access?{' '}
            <Link
              href="/register"
              className="font-medium text-accent hover:underline cursor-pointer"
            >
              Request staff account
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

