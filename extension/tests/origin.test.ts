import { describe, it, expect } from 'vitest';
import { isBvshopUrl, bvshopOriginOf } from '../src/bvshop/origin.js';

describe('bvshop origin helpers', () => {
  it('recognizes both test and production BVSHOP urls', () => {
    expect(isBvshopUrl('https://bvshop-manage.bv-shop.tw/order?page=1')).toBe(true);
    expect(isBvshopUrl('https://bvshop-manage.bvshop.tw/order?page=1')).toBe(true);
  });

  it('returns false for non-BVSHOP url and empty values', () => {
    expect(isBvshopUrl('https://example.com/order')).toBe(false);
    expect(isBvshopUrl('')).toBe(false);
    expect(isBvshopUrl(undefined)).toBe(false);
  });

  it('extracts origin for both BVSHOP hosts', () => {
    expect(bvshopOriginOf('https://bvshop-manage.bv-shop.tw/order?page=2')).toBe(
      'https://bvshop-manage.bv-shop.tw'
    );
    expect(bvshopOriginOf('https://bvshop-manage.bvshop.tw/order?page=2')).toBe(
      'https://bvshop-manage.bvshop.tw'
    );
  });

  it('returns undefined for non-BVSHOP or invalid urls', () => {
    expect(bvshopOriginOf('https://example.com/order')).toBeUndefined();
    expect(bvshopOriginOf('not-a-url')).toBeUndefined();
    expect(bvshopOriginOf(undefined)).toBeUndefined();
  });
});
