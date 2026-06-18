import { describe, expect, it } from 'vitest';
import { decodeTcatPdf, detectProvider, makePrintSeq } from '../index.js';
import { arrangePrintPairs } from '../sort.js';

describe('makePrintSeq', () => {
  it('formats with minimum width 3', () => {
    expect(makePrintSeq(1, 25)).toBe('001 / 025');
  });

  it('uses total width when total is larger than 999', () => {
    expect(makePrintSeq(1, 1200)).toBe('0001 / 1200');
  });

  it('handles edge values safely', () => {
    expect(makePrintSeq(0, 0)).toBe('001 / 001');
  });
});

describe('detectProvider', () => {
  it('maps logistic strings correctly', () => {
    expect(detectProvider('黑貓宅急便')).toBe('tcat');
    expect(detectProvider('順豐到付')).toBe('sf');
    expect(detectProvider('統一金流超取')).toBe('payuni');
    expect(detectProvider('ECPay logistics')).toBe('ecpay');
    expect(detectProvider('其他')).toBe('unknown');
  });
});

describe('arrangePrintPairs', () => {
  const pairs = [
    { label: 'L1', slip: 'S1' },
    { label: 'L2', slip: 'S2' },
  ];

  it('outputs PAIR mode order', () => {
    expect(arrangePrintPairs(pairs, 'PAIR')).toEqual(['L1', 'S1', 'L2', 'S2']);
  });

  it('outputs LABELS_FIRST mode order', () => {
    expect(arrangePrintPairs(pairs, 'LABELS_FIRST')).toEqual(['L1', 'L2', 'S1', 'S2']);
  });

  it('outputs SLIPS_FIRST mode order', () => {
    expect(arrangePrintPairs(pairs, 'SLIPS_FIRST')).toEqual(['S1', 'S2', 'L1', 'L2']);
  });
});

describe('decodeTcatPdf', () => {
  it('decodes base64 payload', () => {
    const base64 = Buffer.from('%PDF-1.4 mock').toString('base64');
    const decoded = decodeTcatPdf(base64);
    expect(Buffer.from(decoded).toString()).toBe('%PDF-1.4 mock');
  });
});
