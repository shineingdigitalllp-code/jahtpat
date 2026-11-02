import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { slugify } from '../src/utils/slug.js';
import { AppError } from '../src/utils/app-error.js';
import { env } from '../src/config/env.js';
import { originGuard } from '../src/middlewares/admin-auth.js';
import { getImportTemplateCsv } from '../src/modules/admin/products/service.js';

describe('API Utils, Security & Auth Helpers', () => {
  it('generates URL-safe slugs with lowercase kebab-case and punctuation stripped', () => {
    assert.equal(slugify('Fresh Alphonso Mango 1kg!'), 'fresh-alphonso-mango-1kg');
    assert.equal(slugify('Chicken Curry Cut (Antibiotic Free)'), 'chicken-curry-cut-antibiotic-free');
    assert.equal(slugify('   Oil & Ghee   '), 'oil-ghee');
    assert.equal(slugify('100% Organic'), '100-organic');
  });

  it('constructs AppError with HTTP status, machine error code, and message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Product not found', { slug: 'unknown' });
    assert.equal(err.status, 404);
    assert.equal(err.code, 'NOT_FOUND');
    assert.equal(err.message, 'Product not found');
    assert.deepEqual(err.details, { slug: 'unknown' });
    assert.ok(err instanceof Error);
  });

  it('signs and verifies admin JWT tokens with audience constraint', () => {
    const adminId = 'admin_user_test_123';
    const token = jwt.sign({ sub: adminId, aud: 'admin' }, env.JWT_SECRET, {
      expiresIn: 3600,
    });

    const decoded = jwt.verify(token, env.JWT_SECRET, { audience: 'admin' }) as {
      sub: string;
      aud: string;
    };
    assert.equal(decoded.sub, adminId);
    assert.equal(decoded.aud, 'admin');

    // Reject token signed for different audience
    const customerToken = jwt.sign({ sub: 'cust_123', aud: 'customer' }, env.JWT_SECRET);
    assert.throws(() => {
      jwt.verify(customerToken, env.JWT_SECRET, { audience: 'admin' });
    });
  });

  it('originGuard allows safe methods (GET, HEAD, OPTIONS) without origin header', () => {
    let calledNext = false;
    const req = { method: 'GET', headers: {} } as any;
    const res = {} as any;
    const next = () => {
      calledNext = true;
    };

    originGuard(req, res, next);
    assert.equal(calledNext, true);
  });

  it('originGuard allows state-changing requests from configured admin origins', () => {
    let calledNext = false;
    const req = {
      method: 'POST',
      headers: { origin: 'http://localhost:3001' },
    } as any;
    const res = {} as any;
    const next = () => {
      calledNext = true;
    };

    originGuard(req, res, next);
    assert.equal(calledNext, true);
  });

  it('originGuard throws 403 on state-changing requests from untrusted origins', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'http://evil-attacker.com' },
    } as any;
    const res = {} as any;
    const next = () => {};

    assert.throws(
      () => {
        originGuard(req, res, next);
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 403);
        assert.equal(err.code, 'FORBIDDEN');
        return true;
      },
    );
  });

  it('returns valid CSV template headers for product bulk imports', () => {
    const csv = getImportTemplateCsv();
    assert.ok(csv.includes('Name,Category,MRP (INR),Selling Price (INR),Stock,Unit'));
    assert.ok(csv.includes('Alphonso Mango'));
  });
});

