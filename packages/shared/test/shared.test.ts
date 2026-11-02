import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  productQuerySchema,
  mobileSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
  couponInputSchema,
  storeSettingsSchema,
  productImportRowSchema,
  updateTeamMemberSchema,
  adminLoginSchema,
  ADMIN_PASSWORD_REGEX,
} from '../src/index.js';

describe('Shared Schemas & Validation', () => {
  it('validates product filters and sets defaults', () => {
    const parsed = productQuerySchema.parse({});
    assert.equal(parsed.sort, 'popular');
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.cursor, undefined);

    const withFilter = productQuerySchema.parse({
      category: 'fruits-vegetables',
      minRating: '4',
      limit: '15',
    });
    assert.equal(withFilter.category, 'fruits-vegetables');
    assert.equal(withFilter.minRating, 4);
    assert.equal(withFilter.limit, 15);
  });

  it('validates 10-digit Indian mobile numbers and passwords', () => {
    assert.equal(mobileSchema.safeParse('9876543210').success, true);
    assert.equal(mobileSchema.safeParse('1234567890').success, false);
    assert.equal(mobileSchema.safeParse('98765').success, false);
    assert.equal(mobileSchema.safeParse('abcdefghij').success, false);

    assert.equal(passwordSchema.safeParse('short').success, false);
    assert.equal(passwordSchema.safeParse('ValidPass123').success, true);
  });

  it('validates storefront user login schema with phone or email identifier', () => {
    assert.equal(loginSchema.safeParse({ identifier: '9876543210', password: 'Password123' }).success, true);
    assert.equal(loginSchema.safeParse({ identifier: 'user@example.com', password: 'Password123' }).success, true);
    assert.equal(loginSchema.safeParse({ identifier: 'not-valid', password: 'Password123' }).success, false);
  });

  it('validates storefront user registration schema', () => {
    const valid = registerSchema.safeParse({
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@example.com',
      password: 'SecurePassword123',
    });
    assert.equal(valid.success, true);

    const invalidMobile = registerSchema.safeParse({
      name: 'John Doe',
      mobile: '12345',
      password: 'SecurePassword123',
    });
    assert.equal(invalidMobile.success, false);
  });

  it('validates store settings schema', () => {
    const valid = storeSettingsSchema.parse({
      name: 'Jhatpat Express',
      isOpen: true,
      etaMinutes: 10,
      deliveryFeePaise: 2900,
      freeDeliveryAbovePaise: 29900,
      minOrderPaise: 9900,
      lowStockThreshold: 10,
    });
    assert.equal(valid.isOpen, true);
    assert.equal(valid.name, 'Jhatpat Express');
  });

  it('validates product import CSV row schema', () => {
    const row = {
      name: 'Organic Honey',
      categoryName: 'Staples',
      unit: '500 g',
      priceRupees: '299',
      mrpRupees: '350',
      stock: '50',
    };
    const res = productImportRowSchema.safeParse(row);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.priceRupees, 299);
      assert.equal(res.data.mrpRupees, 350);
      assert.equal(res.data.stock, 50);
    }
  });

  it('validates coupon input schema with constraints', () => {
    const now = Date.now();
    const coupon = {
      code: 'festive20',
      title: '20% off up to ₹100',
      subtitle: 'Valid on festive sweets',
      image: '/images/catalog/gift.jpg',
      category: 'general',
      type: 'percent',
      value: 20,
      minOrderPaise: 29900,
      maxDiscountPaise: 10000,
      validFrom: new Date(now).toISOString(),
      validTo: new Date(now + 86400000).toISOString(),
    };
    const res = couponInputSchema.safeParse(coupon);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.code, 'FESTIVE20');
      assert.equal(res.data.type, 'percent');
    }
  });

  it('validates admin authentication credentials and password complexity', () => {
    assert.equal(ADMIN_PASSWORD_REGEX.test('Short1'), false);
    assert.equal(ADMIN_PASSWORD_REGEX.test('nouppercaseornumber'), false);
    assert.equal(ADMIN_PASSWORD_REGEX.test('SecurePass123!'), true);

    const loginRes = adminLoginSchema.safeParse({
      email: 'admin@jhatpat.com',
      password: 'SecurePass123!',
    });
    assert.equal(loginRes.success, true);
  });

  it('validates team role and status enum transitions', () => {
    assert.equal(updateTeamMemberSchema.safeParse({ role: 'manager' }).success, true);
    assert.equal(updateTeamMemberSchema.safeParse({ role: 'staff' }).success, true);
    assert.equal(updateTeamMemberSchema.safeParse({ role: 'superuser' }).success, false);
    assert.equal(updateTeamMemberSchema.safeParse({ status: 'suspended' }).success, true);
  });
});
