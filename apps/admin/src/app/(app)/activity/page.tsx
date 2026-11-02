'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  History,
  RotateCcw,
} from 'lucide-react';
import type { AdminActivityItem, AdminActivityResponse, AdminTeamMember } from '@jhatpat/shared';
import { apiFetch } from '@/lib/api-client';
import { useAdmin } from '@/lib/auth-context';
import { formatDateIST, formatTimeIST, formatRelativeTime } from '@/lib/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import ForbiddenPage from '../forbidden/page';

const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'order', label: 'Orders' },
  { value: 'product', label: 'Products' },
  { value: 'category', label: 'Categories' },
  { value: 'coupon', label: 'Coupons' },
  { value: 'banner', label: 'Banners' },
  { value: 'customer', label: 'Customers' },
  { value: 'admin_user', label: 'Team Members' },
  { value: 'store_setting', label: 'Settings' },
];

function getEntityLink(entity: string, entityId: string): string | null {
  switch (entity.toLowerCase()) {
    case 'order':
      return `/orders/${entityId}`;
    case 'product':
      return `/products/${entityId}`;
    case 'category':
      return `/categories`;
    case 'coupon':
      return `/coupons`;
    case 'banner':
      return `/banners`;
    case 'customer':
      return `/customers/${entityId}`;
    case 'admin_user':
      return `/team`;
    case 'store_setting':
    case 'settings':
      return `/settings`;
    default:
      return null;
  }
}

function formatActionText(item: AdminActivityItem): string {
  const { action, entityId, meta } = item;

  switch (action) {
    case 'status_change':
    case 'order.status_changed':
    case 'update_order_status': {
      const target = meta?.to || meta?.status;
      return target
        ? `Changed order status to ${target.replace(/_/g, ' ')}`
        : `Updated order status`;
    }
    case 'update_delivery':
    case 'order.delivery_assigned':
      return `Assigned rider ${meta?.riderName || ''} to delivery`;
    case 'update_note':
    case 'order.note_added':
      return `Added note to order`;
    case 'register_owner':
      return `Registered initial store owner account`;
    case 'login':
      return `Signed in to administrative panel`;
    case 'logout':
      return `Signed out of session`;
    case 'change_password':
      return `Changed administrative account password`;
    case 'create_product':
      return meta?.name ? `Created product "${meta.name}"` : `Created catalog product`;
    case 'update_product':
      return meta?.name ? `Updated product "${meta.name}"` : `Updated product details`;
    case 'delete_product':
      return `Deleted product from catalog`;
    case 'create_category':
      return meta?.name ? `Created category "${meta.name}"` : `Created new category`;
    case 'update_category':
      return meta?.name ? `Updated category "${meta.name}"` : `Updated category details`;
    case 'delete_category':
      return `Deleted category from catalog`;
    case 'reorder_categories':
      return `Reordered category hierarchy (${meta?.count ?? ''} items)`;
    case 'create_coupon':
      return meta?.code ? `Created coupon "${meta.code}"` : `Created coupon voucher`;
    case 'update_coupon':
      return meta?.code ? `Updated coupon "${meta.code}"` : `Updated coupon voucher`;
    case 'delete_coupon':
      return `Deleted coupon voucher`;
    case 'create_banner':
      return meta?.title ? `Added banner "${meta.title}"` : `Added promotional billboard banner`;
    case 'update_banner':
      return meta?.title ? `Updated banner "${meta.title}"` : `Updated promotional billboard`;
    case 'delete_banner':
      return `Deleted promotional billboard`;
    case 'reorder_banners':
      return `Reordered promotional billboard sequence`;
    case 'block_customer':
    case 'customer.blocked':
      return `Blocked customer account`;
    case 'unblock_customer':
    case 'customer.unblocked':
      return `Unblocked customer account`;
    case 'adjust_wallet': {
      const amount = meta?.amountPaise ? meta.amountPaise / 100 : 0;
      const sign = amount > 0 ? '+' : '';
      return `Adjusted wallet balance by ${sign}₹${Math.abs(amount).toFixed(0)}${
        meta?.reason ? ` (${meta.reason})` : ''
      }`;
    }
    case 'update_store_settings':
      return `Updated store operations & delivery settings`;
    case 'update_team_member':
      return `Updated administrative permissions for team member`;
    case 'reject_team_member':
      return `Rejected staff registration request`;
    case 'reset_member_password':
      return `Generated single-use temporary password reset`;
    default:
      return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export default function ActivityPage() {
  const { admin } = useAdmin();
  const [selectedEntity, setSelectedEntity] = React.useState('');
  const [selectedAdminId, setSelectedAdminId] = React.useState('');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [expandedRows, setExpandedRows] = React.useState<Record<number, boolean>>({});

  // Query team members to populate the admin filter dropdown
  const { data: teamMembers } = useQuery<AdminTeamMember[]>({
    queryKey: ['admin', 'team'],
    queryFn: () => apiFetch<AdminTeamMember[]>('/api/v1/admin/team'),
    enabled: admin?.role === 'owner',
  });

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('pageSize', '25');
  if (selectedEntity) queryParams.set('entity', selectedEntity);
  if (selectedAdminId) queryParams.set('adminId', selectedAdminId);
  if (fromDate) queryParams.set('from', new Date(fromDate).toISOString());
  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    queryParams.set('to', to.toISOString());
  }

  const { data, isLoading, isFetching } = useQuery<AdminActivityResponse>({
    queryKey: ['admin', 'activity', queryParams.toString()],
    queryFn: () =>
      apiFetch<AdminActivityResponse>(`/api/v1/admin/activity?${queryParams.toString()}`),
    enabled: admin?.role === 'owner' || admin?.role === 'manager',
  });

  if (admin && admin.role === 'staff') {
    return <ForbiddenPage />;
  }

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleResetFilters = () => {
    setSelectedEntity('');
    setSelectedAdminId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasActiveFilters = !!(selectedEntity || selectedAdminId || fromDate || toDate);
  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Audit Log"
        description="Chronological record of administrative operations, catalog changes, and customer modifications."
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Entity Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 w-full sm:w-44 rounded-[8px] border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Filter (if owner with team list available) */}
            {teamMembers && teamMembers.length > 0 && (
              <div className="w-full sm:w-auto">
                <select
                  value={selectedAdminId}
                  onChange={(e) => {
                    setSelectedAdminId(e.target.value);
                    setPage(1);
                  }}
                  className="h-8.5 w-full sm:w-48 rounded-[8px] border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="">All Staff Members</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Inputs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 w-36 text-xs bg-surface"
                placeholder="From date"
              />
              <span className="text-xs text-muted">to</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-8.5 w-36 text-xs bg-surface"
                placeholder="To date"
              />
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8.5 text-xs text-muted hover:text-ink gap-1 px-2.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-muted font-medium select-none">
                  <th className="w-10 px-3 py-3 text-center"></th>
                  <th className="w-48 px-4 py-3 font-medium">Time (IST)</th>
                  <th className="w-56 px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Action Description</th>
                  <th className="w-52 px-4 py-3 text-right font-medium">Target Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td className="w-10 px-3 py-3.5 text-center">
                        <Skeleton className="h-4 w-4 mx-auto rounded" />
                      </td>
                      <td className="w-48 px-4 py-3.5">
                        <div className="space-y-1">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </td>
                      <td className="w-56 px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                          <div className="space-y-1 min-w-0">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Skeleton className="h-3.5 w-48" />
                      </td>
                      <td className="w-52 px-4 py-3.5 text-right">
                        <Skeleton className="h-5 w-28 ml-auto rounded" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <History className="h-8 w-8 text-muted-fg stroke-[1.5]" />
                        <span className="font-medium text-ink">No audit logs found</span>
                        <span className="text-[11px] text-muted max-w-sm">
                          {hasActiveFilters
                            ? 'Try clearing the applied filters above to see more records.'
                            : 'Administrative operations will be recorded here automatically.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isExpanded = !!expandedRows[item.id];
                    const hasMeta =
                      item.meta &&
                      typeof item.meta === 'object' &&
                      Object.keys(item.meta).length > 0;
                    const entityLink = getEntityLink(item.entity, item.entityId);

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-surface-2/40 transition-colors">
                          {/* Accordion expand toggle */}
                          <td className="w-10 px-3 py-3.5 text-center align-middle">
                            {hasMeta ? (
                              <button
                                type="button"
                                onClick={() => toggleRow(item.id)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-muted hover:text-ink hover:bg-surface-2 cursor-pointer transition-colors"
                                aria-label="Toggle metadata"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-6" />
                            )}
                          </td>

                          {/* Time */}
                          <td className="w-48 px-4 py-3.5 whitespace-nowrap align-middle">
                            <div className="font-medium text-ink text-xs">
                              {formatDateIST(item.createdAt)}, {formatTimeIST(item.createdAt)}
                            </div>
                            <div className="text-[11px] text-muted-fg mt-0.5">
                              {formatRelativeTime(item.createdAt)}
                            </div>
                          </td>

                          {/* Admin */}
                          <td className="w-56 px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar name={item.adminName} size="sm" />
                              <div className="min-w-0">
                                <div className="font-semibold text-ink text-xs truncate leading-snug">
                                  {item.adminName}
                                </div>
                                <div className="text-[11px] text-muted truncate leading-snug">
                                  {item.adminEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Action Description */}
                          <td className="px-4 py-3.5 align-middle">
                            <span className="text-ink font-medium text-xs leading-relaxed">
                              {formatActionText(item)}
                            </span>
                          </td>

                          {/* Entity Target Link (Right Aligned) */}
                          <td className="w-52 px-4 py-3.5 whitespace-nowrap text-right align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <span className="inline-flex items-center rounded-[6px] border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-mono font-medium text-muted uppercase tracking-wider">
                                {item.entity}
                              </span>
                              {entityLink ? (
                                <Link
                                  href={entityLink}
                                  className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline font-medium"
                                >
                                  <span>#{item.entityId.slice(0, 8)}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </Link>
                              ) : (
                                <span className="font-mono text-xs text-muted">
                                  #{item.entityId.slice(0, 8)}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Meta Row */}
                        {isExpanded && hasMeta && (
                          <tr className="bg-surface-2/60">
                            <td colSpan={5} className="py-3 px-6">
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                                  Metadata payload
                                </div>
                                <pre className="p-3 rounded-[8px] border border-border bg-surface text-[11px] font-mono text-ink overflow-x-auto max-h-52 leading-relaxed">
                                  {JSON.stringify(item.meta, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 border-t border-border bg-surface-2/40 text-xs">
              <span className="text-muted">
                Showing Page <span className="font-semibold text-ink">{meta.page}</span> of{' '}
                <span className="font-semibold text-ink">{meta.totalPages}</span> ({meta.total} total
                events)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
