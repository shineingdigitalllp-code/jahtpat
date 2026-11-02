import { db } from '@/config/db';
import { AppError } from '@/utils/app-error';
import type {
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminCustomerListResponse,
} from '@jhatpat/shared';

interface ListCustomersParams {
  q?: string;
  blocked?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(params: ListCustomersParams): Promise<AdminCustomerListResponse> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

  const where: any = {};
  if (params.blocked !== undefined) {
    where.isBlocked = params.blocked;
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { mobile: { contains: params.q } },
      { email: { contains: params.q } },
    ];
  }

  const total = await db.user.count({ where });

  // For 'recent', we sort directly in database
  let orderBy: any = { createdAt: 'desc' };

  const users = await db.user.findMany({
    where,
    orderBy,
    include: {
      orders: {
        where: {
          status: { notIn: ['cancelled', 'pending_payment'] },
          paymentStatus: { not: 'failed' },
        },
        select: {
          totalPaise: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { orders: true },
      },
    },
  });

  let items: AdminCustomerListItem[] = users.map((u) => {
    const lifetimeSpendPaise = u.orders.reduce((acc, o) => acc + o.totalPaise, 0);
    const lastOrderAt = u.orders[0]?.createdAt.toISOString() ?? null;

    return {
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      email: u.email,
      walletPaise: u.walletPaise,
      isBlocked: u.isBlocked,
      ordersCount: u._count.orders,
      lifetimeSpendPaise,
      lastOrderAt,
      createdAt: u.createdAt.toISOString(),
    };
  });

  // Handle in-memory sorting for computed orders count / lifetime spend if requested
  if (params.sort === 'orders') {
    items.sort((a, b) => b.ordersCount - a.ordersCount);
  } else if (params.sort === 'spend') {
    items.sort((a, b) => b.lifetimeSpendPaise - a.lifetimeSpendPaise);
  }

  // Slice for pagination
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paginatedItems,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getCustomerById(id: string): Promise<AdminCustomerDetail> {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: { isDefault: 'desc' },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: {
            select: { items: true },
          },
        },
      },
      walletTxns: {
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: { orders: true },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  const validOrders = user.orders.filter(
    (o) => o.status !== 'cancelled' && o.status !== 'pending_payment' && o.paymentStatus !== 'failed',
  );

  const lifetimeSpendPaise = validOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const aovPaise = validOrders.length > 0 ? Math.round(lifetimeSpendPaise / validOrders.length) : 0;

  return {
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    walletPaise: user.walletPaise,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt.toISOString(),
    stats: {
      ordersCount: user._count.orders,
      lifetimeSpendPaise,
      aovPaise,
      walletBalancePaise: user.walletPaise,
    },
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: a.isDefault,
    })),
    recentOrders: user.orders.map((o) => ({
      code: o.code,
      itemCount: o._count.items,
      totalPaise: o.totalPaise,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    walletTransactions: user.walletTxns.map((t) => ({
      id: t.id,
      amountPaise: t.amountPaise,
      reason: t.reason,
      adminName: t.admin.name,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

export async function blockCustomer(id: string, blocked: boolean) {
  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  const updated = await db.user.update({
    where: { id },
    data: { isBlocked: blocked },
    select: { id: true, name: true, isBlocked: true },
  });

  return updated;
}

export async function adjustWalletBalance(
  id: string,
  adminId: string,
  amountPaise: number,
  reason: string,
) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  const newBalance = user.walletPaise + amountPaise;
  if (newBalance < 0) {
    throw new AppError(400, 'INSUFFICIENT_BALANCE', 'Customer wallet balance cannot be negative');
  }

  const result = await db.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id },
      data: { walletPaise: newBalance },
      select: { id: true, walletPaise: true },
    });

    const txn = await tx.walletTransaction.create({
      data: {
        userId: id,
        adminId,
        amountPaise,
        reason,
      },
      include: {
        admin: {
          select: { name: true },
        },
      },
    });

    return { updatedUser, txn };
  });

  return {
    walletBalancePaise: result.updatedUser.walletPaise,
    transaction: {
      id: result.txn.id,
      amountPaise: result.txn.amountPaise,
      reason: result.txn.reason,
      adminName: result.txn.admin.name,
      createdAt: result.txn.createdAt.toISOString(),
    },
  };
}

