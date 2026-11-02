'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { AdminRole, AdminStatus, AdminTeamMember } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { formatDateTimeIST, formatRelativeTime } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';
import ForbiddenPage from '../forbidden/page';

export default function TeamPage() {
  const { admin } = useAdmin();
  const queryClient = useQueryClient();

  // Dialog state for Password Reset reveal
  const [resetModalMember, setResetModalMember] = React.useState<AdminTeamMember | null>(null);
  const [generatedTempPassword, setGeneratedTempPassword] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Rejection confirmation dialog
  const [rejectingMember, setRejectingMember] = React.useState<AdminTeamMember | null>(null);

  // Selected approval role per pending member
  const [approvalRoles, setApprovalRoles] = React.useState<Record<string, AdminRole>>({});

  const { data: members, isLoading } = useQuery<AdminTeamMember[]>({
    queryKey: ['admin', 'team'],
    queryFn: () => apiFetch<AdminTeamMember[]>('/api/v1/admin/team'),
    enabled: admin?.role === 'owner',
  });

  // Role update mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminRole }) =>
      apiFetch(`/api/v1/admin/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      toast.success('Team member role updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update member role');
    },
  });

  // Status update mutation (approve / suspend / activate)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, role }: { id: string; status: AdminStatus; role?: AdminRole }) =>
      apiFetch(`/api/v1/admin/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(role ? { role } : {}) }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      toast.success(
        vars.status === 'active'
          ? 'Member approved & activated'
          : vars.status === 'suspended'
            ? 'Account suspended'
            : 'Account status updated',
      );
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update account status');
    },
  });

  // Reject pending member mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/admin/team/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      toast.success('Registration request rejected');
      setRejectingMember(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reject registration request');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ tempPassword: string }>(`/api/v1/admin/team/${id}/reset-password`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });
      setGeneratedTempPassword(data.tempPassword);
      toast.success('Temporary password generated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to reset password');
    },
  });

  if (admin && admin.role !== 'owner') {
    return <ForbiddenPage />;
  }

  const teamList = members ?? [];
  const pendingMembers = teamList.filter((m) => m.status === 'pending');
  const activeMembers = teamList.filter((m) => m.status !== 'pending');

  const activeOwnerCount = teamList.filter(
    (m) => m.role === 'owner' && m.status === 'active',
  ).length;

  const copyToClipboard = () => {
    if (!generatedTempPassword) return;
    navigator.clipboard.writeText(generatedTempPassword);
    setCopied(true);
    toast.info('Copied temporary password to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const closeResetModal = () => {
    setResetModalMember(null);
    setGeneratedTempPassword(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Review pending staff registrations, adjust administrative roles, and manage access security."
      />

      {/* Pending Approvals Section (Pinned on Top) */}
      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-[12px]" />
      ) : pendingMembers.length > 0 ? (
        <Card className="border-[var(--tone-warning-text)]/30 bg-[var(--tone-warning-bg)]/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[var(--tone-warning-text)] animate-pulse" />
              <CardTitle className="text-sm font-semibold text-ink">
                Pending Staff Approvals ({pendingMembers.length})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              New team members have registered and are awaiting access approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMembers.map((member) => {
              const selectedRole = approvalRoles[member.id] || 'staff';
              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-surface border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.name} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink truncate flex items-center gap-2">
                        <span>{member.name}</span>
                        <StatusPill tone="warning" label="Pending Approval" />
                      </div>
                      <div className="text-[11px] text-muted truncate">{member.email}</div>
                      <div className="text-[10px] text-muted-fg mt-0.5">
                        Requested {formatRelativeTime(member.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Role selector */}
                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setApprovalRoles((prev) => ({
                          ...prev,
                          [member.id]: e.target.value as AdminRole,
                        }))
                      }
                      className="h-8 rounded-[8px] border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="owner">Owner</option>
                    </select>

                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: member.id,
                          status: 'active',
                          role: selectedRole,
                        })
                      }
                      loading={updateStatusMutation.isPending}
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Approve
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[var(--tone-danger-text)] hover:bg-[var(--tone-danger-bg)] hover:border-[var(--tone-danger-text)]"
                      onClick={() => setRejectingMember(member)}
                    >
                      <UserX className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Main Team Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-ink">Active Team Members</CardTitle>
          <CardDescription className="text-xs">
            All administrative users with active or suspended system permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-muted font-medium select-none">
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="w-36 px-4 py-3 font-medium">Role</th>
                  <th className="w-36 px-4 py-3 font-medium">Status</th>
                  <th className="w-48 px-4 py-3 font-medium">Last Login</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </td>
                      <td className="w-36 px-4 py-3.5">
                        <Skeleton className="h-7 w-24" />
                      </td>
                      <td className="w-36 px-4 py-3.5">
                        <Skeleton className="h-5 w-16" />
                      </td>
                      <td className="w-48 px-4 py-3.5">
                        <Skeleton className="h-3.5 w-24" />
                      </td>
                      <td className="w-20 px-4 py-3.5 text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : activeMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  activeMembers.map((member) => {
                    const isSelf = member.id === admin?.id;
                    const isLastActiveOwner =
                      member.role === 'owner' &&
                      member.status === 'active' &&
                      activeOwnerCount <= 1;

                    return (
                      <tr key={member.id} className="hover:bg-surface-2/50 transition-colors">
                        {/* Member Name & Email */}
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} size="sm" />
                            <div className="min-w-0">
                              <div className="font-semibold text-ink flex items-center gap-1.5">
                                <span className="truncate">{member.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] text-muted rounded bg-surface-2 px-1.5 py-0.2">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted truncate">{member.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column (Inline Select with Guard Tooltips) */}
                        <td className="w-36 px-4 py-3.5 align-middle">
                          {isSelf ? (
                            <Tooltip content="You cannot change your own role">
                              <span className="inline-block cursor-not-allowed">
                                <select
                                  disabled
                                  value={member.role}
                                  className="h-7 rounded-[6px] border border-border bg-surface-2 px-2 text-[11px] text-muted cursor-not-allowed opacity-75"
                                >
                                  <option value={member.role}>
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                  </option>
                                </select>
                              </span>
                            </Tooltip>
                          ) : isLastActiveOwner ? (
                            <Tooltip content="At least one active owner must remain">
                              <span className="inline-block cursor-not-allowed">
                                <select
                                  disabled
                                  value="owner"
                                  className="h-7 rounded-[6px] border border-border bg-surface-2 px-2 text-[11px] text-muted cursor-not-allowed opacity-75"
                                >
                                  <option value="owner">Owner</option>
                                </select>
                              </span>
                            </Tooltip>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateRoleMutation.mutate({
                                  id: member.id,
                                  role: e.target.value as AdminRole,
                                })
                              }
                              disabled={updateRoleMutation.isPending}
                              className="h-7 rounded-[6px] border border-border bg-surface px-2 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:border-border-strong transition-colors"
                            >
                              <option value="staff">Staff</option>
                              <option value="manager">Manager</option>
                              <option value="owner">Owner</option>
                            </select>
                          )}
                        </td>

                        {/* Status Pill */}
                        <td className="w-36 px-4 py-3.5 align-middle">
                          <StatusPill
                            tone={
                              member.status === 'active'
                                ? 'success'
                                : member.status === 'suspended'
                                  ? 'danger'
                                  : 'warning'
                            }
                            label={
                              member.status === 'active'
                                ? 'Active'
                                : member.status === 'suspended'
                                  ? 'Suspended'
                                  : 'Pending'
                            }
                          />
                        </td>

                        {/* Last Login */}
                        <td className="w-48 px-4 py-3.5 align-middle text-muted text-[11px]">
                          {member.lastLoginAt ? (
                            <span>{formatDateTimeIST(member.lastLoginAt)}</span>
                          ) : (
                            <span className="italic text-muted-fg">Never logged in</span>
                          )}
                        </td>

                        {/* Row Actions Menu */}
                        <td className="w-20 px-4 py-3.5 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 cursor-pointer"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              {/* Suspend / Activate Action */}
                              {isSelf ? (
                                <Tooltip content="You cannot suspend your own account" side="left">
                                  <div>
                                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                      <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                      <span>Suspend account</span>
                                    </DropdownMenuItem>
                                  </div>
                                </Tooltip>
                              ) : isLastActiveOwner && member.status === 'active' ? (
                                <Tooltip
                                  content="At least one active owner must remain"
                                  side="left"
                                >
                                  <div>
                                    <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                      <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                      <span>Suspend account</span>
                                    </DropdownMenuItem>
                                  </div>
                                </Tooltip>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: member.id,
                                      status: member.status === 'active' ? 'suspended' : 'active',
                                    })
                                  }
                                  danger={member.status === 'active'}
                                >
                                  {member.status === 'active' ? (
                                    <>
                                      <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                      <span>Suspend account</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                      <span>Activate account</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Reset Password Action */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setResetModalMember(member);
                                  setGeneratedTempPassword(null);
                                }}
                              >
                                <KeyRound className="h-3.5 w-3.5 mr-2" />
                                <span>Reset password</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={!!rejectingMember}
        onOpenChange={(open) => !open && setRejectingMember(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Registration Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the registration request for{' '}
              <span className="font-semibold text-ink">{rejectingMember?.name}</span> (
              {rejectingMember?.email})? This record will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setRejectingMember(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              onClick={() => rejectingMember && rejectMutation.mutate(rejectingMember.id)}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal (Single-use reveal) */}
      <Dialog open={!!resetModalMember} onOpenChange={(open) => !open && closeResetModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent" />
              <span>Reset Password</span>
            </DialogTitle>
            <DialogDescription>
              Reset administrative password for{' '}
              <span className="font-semibold text-ink">{resetModalMember?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {!generatedTempPassword ? (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] bg-surface-2 p-3 text-xs text-muted leading-relaxed">
                A temporary password will be generated for this user. On their next sign in, they
                will be prompted to create their own new permanent password.
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={closeResetModal}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  loading={resetPasswordMutation.isPending}
                  onClick={() =>
                    resetModalMember && resetPasswordMutation.mutate(resetModalMember.id)
                  }
                >
                  Generate Temporary Password
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-[8px] border border-[var(--tone-warning-text)]/30 bg-[var(--tone-warning-bg)]/20 p-3 text-xs text-ink flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[var(--tone-warning-text)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Important Security Notice</div>
                  <div className="text-[11px] text-muted">
                    This temporary password will be shown <strong>only once</strong>. Copy and share
                    it securely with the team member.
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted">Temporary Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-sm bg-surface-2 border border-border px-3 py-2 rounded-[8px] text-ink select-all">
                    {generatedTempPassword}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="shrink-0 h-10 px-3"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5 text-[var(--tone-success-text)]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button size="sm" onClick={closeResetModal} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

