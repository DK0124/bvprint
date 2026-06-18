import { describe, expect, it } from 'vitest';
import type { BvOrderDetail } from '@bvprint/bvshop-api';
import { renderThermalSlipHtml } from '../thermal.js';

const baseOrder: BvOrderDetail = {
  id: 1,
  uid: 'TEST001',
  createdAt: '2026-01-01',
  orderStatus: 1,
  paymentStatus: 2,
  logisticStatus: 1,
  paymentMethod: '信用卡',
  logisticMethod: '黑貓宅配',
  discountPrice: 0,
  shippingFee: 60,
  fee: 0,
  totalPrice: 1060,
  receiverName: '王小明',
  receiverPhone: '0912345678',
  receiverAddress: '台北市中正區測試路 1 號',
  customerId: 10,
  orderItems: [{ id: 1, productId: '1-', photo: '', name: '商品A', quantity: 1 }],
  customizeItems: [{ id: 2, productId: '2-', photo: '', name: '客製B', quantity: 2 }],
};

describe('renderThermalSlipHtml', () => {
  it('shows address for home delivery and hides cvs', () => {
    const html = renderThermalSlipHtml(baseOrder, '001 / 025');
    expect(html).toContain('地址');
    expect(html).not.toContain('超商門市');
    expect(html).toContain('商品A');
    expect(html).toContain('客製B');
  });

  it('shows cvs and hides address for convenience store orders', () => {
    const html = renderThermalSlipHtml(
      {
        ...baseOrder,
        logisticMethod: '超商取貨',
        cvs: {
          storeName: '全家測試店',
          storeNum: '123456',
          storeBrand: 'fami',
        },
      },
      '002 / 025',
    );
    expect(html).toContain('超商門市');
    expect(html).toContain('全家測試店');
    expect(html).not.toContain('地址：</span>');
  });
});
