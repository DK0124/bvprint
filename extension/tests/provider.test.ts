import { describe, it, expect } from 'vitest';
import { detectProvider } from '../src/core/provider.js';

describe('detectProvider', () => {
  it('detects 黑貓', () => {
    expect(detectProvider('黑貓宅急便')).toBe('tcat');
    expect(detectProvider('TCAT express')).toBe('tcat');
    expect(detectProvider('tcat 宅配')).toBe('tcat');
  });

  it('detects 順豐', () => {
    expect(detectProvider('順豐宅配')).toBe('sf');
    expect(detectProvider('SF Express')).toBe('sf');
    expect(detectProvider('SF_Express 到付')).toBe('sf');
  });

  it('detects 統一金流 (PayUni)', () => {
    expect(detectProvider('統一金流 7-ELEVEN')).toBe('payuni');
    expect(detectProvider('PayUni 全家')).toBe('payuni');
    expect(detectProvider('payuni store')).toBe('payuni');
  });

  it('detects 綠界 (ECPay)', () => {
    expect(detectProvider('綠界 7-ELEVEN 店到店')).toBe('ecpay');
    expect(detectProvider('ECPay 全家')).toBe('ecpay');
    expect(detectProvider('ecpay logistics')).toBe('ecpay');
  });

  it('returns unknown for unrecognised strings', () => {
    expect(detectProvider('貨到付款')).toBe('unknown');
    expect(detectProvider('')).toBe('unknown');
    expect(detectProvider('郵局掛號')).toBe('unknown');
  });

  it('is case-insensitive', () => {
    expect(detectProvider('TCAT')).toBe('tcat');
    expect(detectProvider('Ecpay')).toBe('ecpay');
    expect(detectProvider('PAYUNI')).toBe('payuni');
  });
});
