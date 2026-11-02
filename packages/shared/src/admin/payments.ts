import { z } from 'zod';

export const refundPaymentSchema = z.object({
  amountPaise: z.number().int().positive('Refund amount must be greater than 0').optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

export interface PaymentSummary {
  collectedPaise: number;
  codPendingPaise: number;
  failedPaise: number;
  refundedPaise: number;
}

export interface AdminPaymentListItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerMobile: string | null;
  method: string;
  amountPaise: number;
  refundedPaise: number;
  paymentStatus: string;
  orderStatus: string;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
}

export interface AdminPaymentListResponse {
  items: AdminPaymentListItem[];
  summary: PaymentSummary;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  tabCounts: {
    all: number;
    online: number;
    cod: number;
    refundDue: number;
  };
}

