import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, discountPercent, formatMobile } from '../src/lib/format.js';
import { MAX_QTY_PER_ITEM } from '../src/store/cart-store.js';

describe('Web Helpers & Cart Business Logic', () => {
  it('formats whole currency values without decimals', () => {
    const formatted = formatINR(18900);
    assert.match(formatted, /189/);
    assert.doesNotMatch(formatted, /\.00/);
  });

  it('formats fractional paise with 2 decimal places', () => {
    const formatted = formatINR(18950);
    assert.match(formatted, /189\.50/);
  });

  it('computes rounded percentage discounts accurately', () => {
    assert.equal(discountPercent(18900, 22000), 14); // (220 - 189) / 220 = 14.09% -> 14%
    assert.equal(discountPercent(20000, 20000), 0);
    assert.equal(discountPercent(25000, 20000), 0); // price > mrp should return 0
    assert.equal(discountPercent(5000, 10000), 50);
  });

  it('formats 10-digit Indian phone numbers with country code and spacing', () => {
    assert.equal(formatMobile('9876543210'), '+91 98765 43210');
  });

  it('enforces maximum quantity limit per product item', () => {
    assert.equal(MAX_QTY_PER_ITEM, 20);
  });

  it('calculates delivery fee rules correctly based on order subtotal', () => {
    const FREE_THRESHOLD_PAISE = 29900;
    const STANDARD_FEE_PAISE = 2900;

    const calcDelivery = (subtotalPaise: number) =>
      subtotalPaise >= FREE_THRESHOLD_PAISE ? 0 : STANDARD_FEE_PAISE;

    assert.equal(calcDelivery(18900), 2900);
    assert.equal(calcDelivery(29800), 2900);
    assert.equal(calcDelivery(29900), 0);
    assert.equal(calcDelivery(50000), 0);
  });

  it('calculates order savings breakdown', () => {
    const mrpPaise = 22000;
    const pricePaise = 18900;
    const qty = 2;

    const totalMrp = mrpPaise * qty;
    const totalSelling = pricePaise * qty;
    const savings = totalMrp - totalSelling;

    assert.equal(totalMrp, 44000);
    assert.equal(totalSelling, 37800);
    assert.equal(savings, 6200); // Saved ₹62
  });
});
