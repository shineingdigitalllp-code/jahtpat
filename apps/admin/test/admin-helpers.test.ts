import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDateIST,
  formatTimeIST,
} from '../src/lib/format.js';

describe('Admin Formatting & Currency Conversions', () => {
  it('converts paise integers to Indian Rupees without float drift', () => {
    assert.equal(paiseToRupees(18900), 189);
    assert.equal(paiseToRupees(29950), 299.5);
    assert.equal(paiseToRupees(0), 0);
  });

  it('converts rupees string or number inputs to integer paise safely', () => {
    assert.equal(rupeesToPaise(189), 18900);
    assert.equal(rupeesToPaise('189.50'), 18950);
    assert.equal(rupeesToPaise('299'), 29900);
    assert.equal(rupeesToPaise('invalid'), 0);
    assert.equal(rupeesToPaise(0), 0);
  });

  it('formats currency in Indian Rupees format (INR)', () => {
    const formatted = formatINR(18900);
    assert.match(formatted, /189/);
    assert.match(formatted, /₹/);
  });

  it('formats timestamps in Indian Standard Time (Asia/Kolkata)', () => {
    const iso = '2026-10-31T12:00:00.000Z'; // 12:00 UTC = 17:30 IST
    const dateFormatted = formatDateIST(iso);
    const timeFormatted = formatTimeIST(iso);

    assert.match(dateFormatted, /31.*Oct.*2026/);
    assert.match(timeFormatted, /5:30.*pm/i);
  });
});

