import { randomInt } from 'node:crypto';
import type { CheckoutInput, CheckoutQuote, PlacedOrder, PlaceOrderInput } from '@jhatpat/shared';
import { db } from '@/config/db';
import { productSelect, toCard } from '@/modules/catalog/service';
import { assertOnlinePaymentsEnabled, createRazorpayOrder } from '@/modules/payments/service';
import { AppError } from '@/utils/app-error';

const FREE_DELIVERY_MIN_PAISE = 19900;
const DELIVERY_FEE_PAISE = 2000;

async function applyCoupon(code: string, subtotalPaise: number, deliveryPaise: number) {
  const now = new Date();
  const coupon = await db.coupon.findFirst({
    where: { code, isActive: true, validFrom: { lte: now }, validTo: { gte: now } },
  });
  if (!coupon) return { couponPaise: 0, error: 'This coupon is invalid or has expired' };
  if (subtotalPaise < coupon.minOrderPaise) {
    return { couponPaise: 0, error: `Add items worth ₹${Math.ceil((coupon.minOrderPaise - subtotalPaise) / 100)} more to use this coupon` };
  }
  const raw =
    coupon.type === 'percent'
      ? Math.floor((subtotalPaise * coupon.value) / 100)
      : coupon.type === 'flat'
        ? coupon.value
        : deliveryPaise;
  return { couponPaise: Math.min(raw, coupon.maxDiscountPaise ?? raw, subtotalPaise + deliveryPaise), error: null };
}

export async function getQuote(userId: string | undefined, { items, couponCode }: CheckoutInput): Promise<CheckoutQuote> {
  const [products, address, setting] = await Promise.all([
    db.product.findMany({
      where: { id: { in: items.map((item) => item.productId) }, isActive: true },
      select: { ...productSelect, stock: true },
    }),
    userId
      ? db.address.findFirst({
          where: { userId },
          orderBy: { isDefault: 'desc' },
          select: { id: true, label: true, line1: true, line2: true, city: true, pincode: true },
        })
      : null,
    db.storeSetting.findUnique({ where: { id: 1 } }),
  ]);

  const freeDeliveryMin = setting?.freeDeliveryAbovePaise ?? 19900;
  const deliveryFee = setting?.deliveryFeePaise ?? 2000;

  const lines = items.flatMap(({ productId, qty }) => {
    const product = products.find((row) => row.id === productId);
    return product && product.stock > 0 ? [{ product, qty: Math.min(qty, product.stock) }] : [];
  });
  const mrpPaise = lines.reduce((sum, { product, qty }) => sum + product.mrpPaise * qty, 0);
  const subtotalPaise = lines.reduce((sum, { product, qty }) => sum + product.pricePaise * qty, 0);
  const deliveryPaise = subtotalPaise >= freeDeliveryMin || subtotalPaise === 0 ? 0 : deliveryFee;
  const coupon = couponCode ? await applyCoupon(couponCode, subtotalPaise, deliveryPaise) : { couponPaise: 0, error: null };

  return {
    items: lines.map(({ product: { stock: _stock, ...product }, qty }) => ({ product: toCard(product), qty })),
    itemCount: lines.reduce((sum, { qty }) => sum + qty, 0),
    mrpPaise,
    subtotalPaise,
    discountPaise: mrpPaise - subtotalPaise,
    couponCode: couponCode && !coupon.error ? couponCode : null,
    couponPaise: coupon.couponPaise,
    couponError: coupon.error,
    deliveryPaise,
    totalPaise: subtotalPaise + deliveryPaise - coupon.couponPaise,
    address: address && { label: address.label, line1: address.line1, line2: address.line2, city: address.city, pincode: address.pincode },
  };
}

export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<PlacedOrder> {
  const [setting, user] = await Promise.all([
    db.storeSetting.findUnique({ where: { id: 1 } }),
    db.user.findUnique({ where: { id: userId }, select: { isBlocked: true } }),
  ]);

  if (setting && !setting.isOpen) {
    throw new AppError(400, 'STORE_CLOSED', 'Store is currently closed for deliveries. Please check back later.');
  }

  if (user?.isBlocked) {
    throw new AppError(403, 'ACCOUNT_BLOCKED', 'Your account has been suspended from placing orders. Please contact support.');
  }

  const online = input.paymentMethod !== 'cod';
  if (online) assertOnlinePaymentsEnabled();

  const quote = await getQuote(userId, input);
  if (setting?.minOrderPaise && quote.subtotalPaise < setting.minOrderPaise) {
    throw new AppError(400, 'MIN_ORDER_NOT_MET', `Minimum order amount is ₹${setting.minOrderPaise / 100}`);
  }
  if (quote.couponError) throw new AppError(422, 'INVALID_COUPON', quote.couponError);
  if (quote.items.length !== input.items.length || quote.items.some((line, i) => line.qty !== input.items[i]?.qty)) {
    throw new AppError(409, 'CART_CHANGED', 'Some items are out of stock. Please review your cart.');
  }
  const address = await db.address.findFirst({ where: { userId }, orderBy: { isDefault: 'desc' }, select: { id: true } });
  if (!address) throw new AppError(422, 'ADDRESS_REQUIRED', 'Add a delivery address to continue');

  const code = `JP${randomInt(100000, 1000000)}`;
  const order = await db.$transaction(async (tx) => {
    for (const { product, qty } of quote.items) {
      const { count } = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      });
      if (count === 0) throw new AppError(409, 'OUT_OF_STOCK', `${product.name} just went out of stock`);
    }
    return tx.order.create({
      data: {
        code,
        userId,
        addressId: address.id,
        status: online ? 'pending_payment' : 'placed',
        paymentMethod: input.paymentMethod,
        subtotalPaise: quote.mrpPaise,
        discountPaise: quote.discountPaise,
        couponCode: quote.couponCode,
        couponPaise: quote.couponPaise,
        deliveryPaise: quote.deliveryPaise,
        totalPaise: quote.totalPaise,
        items: {
          create: quote.items.map(({ product, qty }) => ({
            productId: product.id,
            name: product.name,
            unit: product.unit,
            qty,
            pricePaise: product.pricePaise,
            mrpPaise: product.mrpPaise,
          })),
        },
      },
      select: { id: true, code: true },
    });
  });

  if (!online) return { ...order, razorpay: null };

  const razorpay = await createRazorpayOrder(quote.totalPaise, order.code);
  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: razorpay.orderId } });
  return { ...order, razorpay };
}
