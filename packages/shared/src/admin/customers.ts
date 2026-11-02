import { z } from 'zod';

export const customerBlockSchema = z.object({
  blocked: z.boolean(),
});

export type CustomerBlockInput = z.infer<typeof customerBlockSchema>;

export const walletAdjustmentSchema = z.object({
  amountPaise: z.number().int().refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(120),
});

export type WalletAdjustmentInput = z.infer<typeof walletAdjustmentSchema>;

export interface AdminCustomerListItem {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  walletPaise: number;
  isBlocked: boolean;
  ordersCount: number;
  lifetimeSpendPaise: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface AdminCustomerListResponse {
  items: AdminCustomerListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  mobile: string | null;
  email: string | null;
  walletPaise: number;
  isBlocked: boolean;
  createdAt: string;
  stats: {
    ordersCount: number;
    lifetimeSpendPaise: number;
    aovPaise: number;
    walletBalancePaise: number;
  };
  addresses: {
    id: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }[];
  recentOrders: {
    code: string;
    itemCount: number;
    totalPaise: number;
    paymentMethod: string;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }[];
  walletTransactions: {
    id: number;
    amountPaise: number;
    reason: string;
    adminName: string;
    createdAt: string;
  }[];
}

