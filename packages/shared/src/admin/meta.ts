export type Tone = 'neutral' | 'info' | 'warning' | 'indigo' | 'success' | 'danger';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['placed', 'cancelled'],
  placed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function nextStatusAction(status: string): { status: string; label: string } | null {
  switch (status) {
    case 'placed':
      return { status: 'preparing', label: 'Start preparing' };
    case 'preparing':
      return { status: 'out_for_delivery', label: 'Out for delivery' };
    case 'out_for_delivery':
      return { status: 'delivered', label: 'Mark delivered' };
    default:
      return null;
  }
}

export const ORDER_STATUS_META: Record<string, StatusMeta> = {
  pending_payment: { label: 'Pending payment', tone: 'neutral' },
  placed: { label: 'Placed', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'warning' },
  out_for_delivery: { label: 'Out for delivery', tone: 'indigo' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const PAYMENT_STATUS_META: Record<string, StatusMeta> = {
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

