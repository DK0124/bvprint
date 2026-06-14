import { describe, it, expect } from 'vitest';
import { normalizeOrder } from '../src/bvshop/normalize.js';
import type { BvOrderRaw } from '../src/types/index.js';

function makeRawOrder(overrides: Partial<BvOrderRaw> = {}): BvOrderRaw {
  return {
    id: 1726850,
    order_form_code: '2605301537Q1M5QR',
    created_at: '2026-05-30 15:37:50',
    receiver_name: '陳柏延',
    receiver_phone: '0921914186',
    zip_address: '103台北市大同區承德路一段17號15樓之1',
    customer_address: {
      zipcode: '103',
      county: '台北市',
      town: '大同區',
      address: '承德路一段17號15樓之1',
    },
    customer_cvs: null,
    logistic_method: '黑貓宅急便',
    log_name: '黑貓宅急便',
    logistics: {
      log_method: 'home',
      isCVSorInStore: false,
    },
    payment_method: '轉帳匯款',
    order_pay_status: 1,
    order_log_status: 1,
    status: 1,
    mergeOrderItems: [
      {
        title: '鏡框 A',
        option_sort: '黑色 / L',
        option_name: 'L',
        quantity: 2,
        special_price: 900,
      },
    ],
    customize_items: [],
    remark: '請先電話聯繫',
    manage_remark: '[BVGLASSES_ORDER]<br />internal',
    total_price: 18850,
    totalText: '18,850',
    tracking_code: null,
    ...overrides,
  };
}

describe('normalizeOrder', () => {
  it('normalizes convenience store orders', () => {
    const normalized = normalizeOrder(
      makeRawOrder({
        customer_cvs: {
          storeName: '香陽門市',
          storeNum: '268981',
          ReservedNo: 'ABC123',
        },
        logistics: {
          log_method: 'cvs',
          isCVSorInStore: true,
        },
        logistic_method: '自訂超商取貨示範 - ',
      })
    );

    expect(normalized.isCvs).toBe(true);
    expect(normalized.cvsStoreName).toBe('香陽門市');
    expect(normalized.cvsStoreNum).toBe('268981');
    expect(normalized.address).toBe('103台北市大同區承德路一段17號15樓之1');
    expect(normalized.items).toEqual([
      { title: '鏡框 A', spec: '黑色 / L', qty: 2 },
    ]);
    expect(normalized.remark).toBe('請先電話聯繫');
    expect(normalized.totalText).toBe('18,850');
  });

  it('normalizes home delivery orders and falls back to structured address/price text', () => {
    const normalized = normalizeOrder(
      makeRawOrder({
        zip_address: '',
        customer_cvs: null,
        logistics: {
          log_method: 'home',
          isCVSorInStore: false,
        },
        totalText: '',
      })
    );

    expect(normalized.isCvs).toBe(false);
    expect(normalized.address).toBe('103台北市大同區承德路一段17號15樓之1');
    expect(normalized.cvsStoreName).toBe('');
    expect(normalized.cvsStoreNum).toBe('');
    expect(normalized.totalText).toBe('18,850');
  });
});
