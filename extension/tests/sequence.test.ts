import { describe, it, expect } from 'vitest';
import { makePrintSeq } from '../src/core/sequence.js';

describe('makePrintSeq', () => {
  it('formats correctly for total=25', () => {
    expect(makePrintSeq(0, 25)).toBe('001 / 025');
    expect(makePrintSeq(1, 25)).toBe('002 / 025');
    expect(makePrintSeq(24, 25)).toBe('025 / 025');
  });

  it('formats correctly for total=3', () => {
    expect(makePrintSeq(0, 3)).toBe('001 / 003');
    expect(makePrintSeq(2, 3)).toBe('003 / 003');
  });

  it('uses wider padding when total > 999', () => {
    expect(makePrintSeq(0, 1000)).toBe('0001 / 1000');
    expect(makePrintSeq(999, 1000)).toBe('1000 / 1000');
  });

  it('handles total=1', () => {
    expect(makePrintSeq(0, 1)).toBe('001 / 001');
  });

  it('handles total=100', () => {
    expect(makePrintSeq(9, 100)).toBe('010 / 100');
  });

  it('uses min width of 3 for small totals', () => {
    expect(makePrintSeq(0, 5)).toBe('001 / 005');
    expect(makePrintSeq(0, 99)).toBe('001 / 099');
  });

  it('handles 4-digit total', () => {
    expect(makePrintSeq(0, 1234)).toBe('0001 / 1234');
    expect(makePrintSeq(1233, 1234)).toBe('1234 / 1234');
  });
});
