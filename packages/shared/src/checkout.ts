import { z } from 'zod';
import type { ProductCard } from './catalog';

export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const checkoutSchema = z.object({
  items: z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(20) }))
    .min(1, 'Your cart is empty')
    .max(50)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, 'Duplicate items in cart'),
  couponCode: z.string().trim().toUpperCase().max(30).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const placeOrderSchema = checkoutSchema.extend({ paymentMethod: z.enum(PAYMENT_METHODS) });
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1).max(64),
  razorpaySignature: z.string().min(1).max(128),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export type CheckoutQuote = {
  items: { product: ProductCard; qty: number }[];
  itemCount: number;
  mrpPaise: number;
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  couponPaise: number;
  couponError: string | null;
  deliveryPaise: number;
  totalPaise: number;
  address: { label: string; line1: string; line2: string | null; city: string; pincode: string } | null;
};

export type PlacedOrder = {
  id: string;
  code: string;
  razorpay: { keyId: string; orderId: string; amountPaise: number } | null;
};
