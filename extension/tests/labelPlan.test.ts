import { describe, it, expect } from 'vitest';
import { planLabel } from '../src/core/labelPlan.js';
import type { PrintOrderData } from '../src/types/index.js';

function makeOrder(orderId: number, logisticMethod: string): PrintOrderData {
  return {
    orderId,
    orderCode: `CODE${orderId}`,
    createdAt: '2026-06-14 00:00:00',
    receiverName: '收件人',
    receiverPhone: '0912345678',
    isCvs: false,
    address: '台中市西區大墩路123號',
    cvsStoreName: '',
    cvsStoreNum: '',
    logisticMethod,
    paymentMethod: '信用卡',
    payStatus: 2,
    logStatus: 1,
    orderStatus: 1,
    items: [],
    remark: '',
    totalPrice: 1000,
    totalText: '1,000',
    trackingCode: null,
  };
}

describe('planLabel', () => {
  it('creates sf_native label plan for 順豐 strings', () => {
    const plan = planLabel(makeOrder(10541, '順豐宅配'));
    expect(plan).toEqual({
      capability: 'sf_native',
      displayText: '順豐 10×15',
      bvshopViewUrl: undefined,
    });
  });

  it('creates sf_native label plan for SF Express strings and test origin url', () => {
    const plan = planLabel(
      makeOrder(10541, 'SF Express'),
      'https://bvshop-manage.bv-shop.tw'
    );
    expect(plan.capability).toBe('sf_native');
    expect(plan.displayText).toBe('順豐 10×15');
    expect(plan.bvshopViewUrl).toBe(
      'https://bvshop-manage.bv-shop.tw/order_multi_print_sf_logistics?ids=10541'
    );
  });

  it('creates sf_native label plan with production origin url', () => {
    const plan = planLabel(
      makeOrder(20001, 'SF_Express 到付'),
      'https://bvshop-manage.bvshop.tw'
    );
    expect(plan.bvshopViewUrl).toBe(
      'https://bvshop-manage.bvshop.tw/order_multi_print_sf_logistics?ids=20001'
    );
  });

  it('returns none for non-SF logistic methods', () => {
    const methods = ['貨到付款', '黑貓宅急便', '', '自訂物流 XYZ'];
    for (const method of methods) {
      const plan = planLabel(makeOrder(100, method), 'https://bvshop-manage.bvshop.tw');
      expect(plan).toEqual({
        capability: 'none',
        displayText: '無物流單',
      });
    }
  });
});
