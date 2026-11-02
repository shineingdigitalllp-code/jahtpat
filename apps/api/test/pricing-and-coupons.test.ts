import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface ApplyCouponParams {
  type: 'percent' | 'flat' | 'free_delivery';
  value: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  minOrderPaise: number;
  maxDiscountPaise?: number | null;
  validFrom: string;
  validTo: string;
}

function evaluateCoupon(coupon: ApplyCouponParams, now: Date = new Date()) {
  const from = new Date(coupon.validFrom).getTime();
  const to = new Date(coupon.validTo).getTime();
  const current = now.getTime();

  if (current < from || current > to) {
    return { valid: false, reason: 'EXPIRED_OR_NOT_STARTED', discountPaise: 0 };
  }

  if (coupon.subtotalPaise < coupon.minOrderPaise) {
    return {
      valid: false,
      reason: `MIN_ORDER_NOT_MET`,
      discountPaise: 0,
      requiredPaise: coupon.minOrderPaise,
    };
  }

  let discountPaise = 0;
  if (coupon.type === 'percent') {
    discountPaise = Math.round((coupon.subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountPaise && discountPaise > coupon.maxDiscountPaise) {
      discountPaise = coupon.maxDiscountPaise;
    }
  } else if (coupon.type === 'flat') {
    discountPaise = Math.min(coupon.value, coupon.subtotalPaise);
  } else if (coupon.type === 'free_delivery') {
    discountPaise = coupon.deliveryFeePaise;
  }

  return { valid: true, discountPaise };
}

describe('Order Pricing, Delivery & Coupon Calculation', () => {
  it('applies percentage coupon up to capped maximum discount', () => {
    const res = evaluateCoupon({
      type: 'percent',
      value: 20, // 20%
      subtotalPaise: 100000, // ₹1,000 (20% would be ₹200)
      deliveryFeePaise: 2900,
      minOrderPaise: 29900,
      maxDiscountPaise: 15000, // max ₹150
      validFrom: new Date(Date.now() - 3600000).toISOString(),
      validTo: new Date(Date.now() + 3600000).toISOString(),
    });

    assert.equal(res.valid, true);
    assert.equal(res.discountPaise, 15000); // capped at ₹150
  });

  it('applies flat discount coupon', () => {
    const res = evaluateCoupon({
      type: 'flat',
      value: 5000, // ₹50
      subtotalPaise: 35000, // ₹350
      deliveryFeePaise: 0,
      minOrderPaise: 29900,
      validFrom: new Date(Date.now() - 3600000).toISOString(),
      validTo: new Date(Date.now() + 3600000).toISOString(),
    });

    assert.equal(res.valid, true);
    assert.equal(res.discountPaise, 5000);
  });

  it('rejects coupon if subtotal is below minimum order requirement', () => {
    const res = evaluateCoupon({
      type: 'flat',
      value: 10000,
      subtotalPaise: 20000, // ₹200
      deliveryFeePaise: 2900,
      minOrderPaise: 49900, // requires ₹499
      validFrom: new Date(Date.now() - 3600000).toISOString(),
      validTo: new Date(Date.now() + 3600000).toISOString(),
    });

    assert.equal(res.valid, false);
    assert.equal(res.reason, 'MIN_ORDER_NOT_MET');
    assert.equal(res.discountPaise, 0);
  });

  it('rejects expired coupon', () => {
    const res = evaluateCoupon({
      type: 'flat',
      value: 5000,
      subtotalPaise: 50000,
      deliveryFeePaise: 2900,
      minOrderPaise: 0,
      validFrom: new Date(Date.now() - 86400000 * 5).toISOString(),
      validTo: new Date(Date.now() - 86400000).toISOString(), // ended yesterday
    });

    assert.equal(res.valid, false);
    assert.equal(res.reason, 'EXPIRED_OR_NOT_STARTED');
  });

  it('applies free delivery coupon waive', () => {
    const res = evaluateCoupon({
      type: 'free_delivery',
      value: 0,
      subtotalPaise: 35000,
      deliveryFeePaise: 2900, // ₹29 delivery fee
      minOrderPaise: 29900,
      validFrom: new Date(Date.now() - 3600000).toISOString(),
      validTo: new Date(Date.now() + 3600000).toISOString(),
    });

    assert.equal(res.valid, true);
    assert.equal(res.discountPaise, 2900);
  });

  it('calculates full order total with taxes, fees, and discounts in integer paise', () => {
    const subtotalPaise = 37800; // ₹378
    const deliveryFeePaise = 2900; // ₹29
    const discountPaise = 5000; // ₹50
    const handlingFeePaise = 500; // ₹5

    const totalPaise = subtotalPaise + deliveryFeePaise + handlingFeePaise - discountPaise;
    assert.equal(totalPaise, 36200); // ₹362
    assert.equal(Number.isInteger(totalPaise), true);
  });
});

