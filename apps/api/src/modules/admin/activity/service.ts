import type { AdminActivityItem, AdminActivityResponse } from '@jhatpat/shared';
import { db } from '@/config/db';

interface ListActivityParams {
  entity?: string;
  adminId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listActivity(params: ListActivityParams): Promise<AdminActivityResponse> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const where: any = {};
  if (params.entity) where.entity = params.entity;
  if (params.adminId) where.adminId = params.adminId;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to);
  }

  const [total, logs] = await Promise.all([
    db.activityLog.count({ where }),
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const items: AdminActivityItem[] = logs.map((l) => ({
    id: l.id,
    adminId: l.adminId,
    adminName: l.admin.name,
    adminEmail: l.admin.email,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    meta: l.meta,
    ip: l.ip,
    createdAt: l.createdAt.toISOString(),
  }));

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

