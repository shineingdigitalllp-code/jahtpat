'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Check, Laptop, LogOut, Moon, Sun, Volume2 } from 'lucide-react';
import {
  ADMIN_PASSWORD_REGEX,
  adminChangePasswordSchema,
  type AdminChangePasswordInput,
} from '@jhatpat/shared';
import { useAdmin } from '@/lib/auth-context';
import { useUIStore } from '@/store/ui-store';
import { apiFetch } from '@/lib/api-client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Switch } from '@/components/ui/Switch';
import { Alert } from '@/components/ui/Alert';

export default function AccountPage() {
  const { admin, logout } = useAdmin();
  const { theme, setTheme } = useTheme();
  const { soundEnabled, setSoundEnabled } = useUIStore();
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
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

  const onChangePassword = async (data: AdminChangePasswordInput) => {
    setPasswordError(null);
    try {
      await apiFetch('/api/v1/admin/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Password updated successfully');
      reset();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Account Settings"
        description="Manage your profile, password security, and admin workspace preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Profile & Preferences */}
        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your registered administrative identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">Full Name</label>
                <Input value={admin?.name ?? ''} readOnly className="bg-surface-2" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">Email Address</label>
                <Input value={admin?.email ?? ''} readOnly className="bg-surface-2" />
                <p className="text-[11px] text-muted">Email address cannot be changed directly.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink">Role</label>
                <div>
                  <span className="inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent capitalize">
                    {admin?.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences & Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your workspace appearance and notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-ink">Interface Theme</div>
                  <div className="text-[11px] text-muted">Select light, dark, or system preference.</div>
                </div>
                <div className="flex items-center gap-1 rounded-[8px] border border-border bg-surface-2 p-1">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors ${
                      theme === 'light' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors ${
                      theme === 'dark' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-colors ${
                      theme === 'system' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-ink flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-muted" />
                    <span>New Order Notification Chime</span>
                  </div>
                  <div className="text-[11px] text-muted">
                    Play an audible alert when a new order arrives.
                  </div>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  aria-label="Toggle notification sound"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Change Password & Sign Out */}
        <div className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your login credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                {passwordError && (
                  <Alert variant="danger">{passwordError}</Alert>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink">Current Password</label>
                  <PasswordInput
                    {...register('currentPassword')}
                    placeholder="Enter current password"
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

                  {/* Requirements Checklist */}
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

                <div className="pt-2">
                  <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sign Out Card */}
          <Card className="border-[var(--tone-danger-text)]/20">
            <CardContent className="pt-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-ink">Sign out of session</div>
                <div className="text-[11px] text-muted">End your administrative session on this device.</div>
              </div>
              <Button variant="danger" size="sm" onClick={logout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

