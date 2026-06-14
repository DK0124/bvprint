import { describe, it, expect } from 'vitest';
import { renderThermalSlipHtml } from '../src/templates/thermal.js';
import type { PrintOrder } from '../src/types/index.js';

function makeOrder(overrides: Partial<PrintOrder['order']> = {}): PrintOrder {
  return {
    orderId: 100,
    orderCode: '2605301537Q1M5QR',
    sortIndex: 0,
    printSeq: 1,
    printSeqText: '001 / 003',
    order: {
      orderId: 100,
      orderCode: '2605301537Q1M5QR',
      createdAt: '2026-05-30 15:37:50',
      receiverName: '王小明',
      receiverPhone: '0912345678',
      isCvs: false,
      address: '台中市西區大墩路123號',
      cvsStoreName: '',
      cvsStoreNum: '',
      logisticMethod: '黑貓宅急便',
      paymentMethod: '信用卡',
      payStatus: 2,
      logStatus: 1,
      orderStatus: 1,
      items: [
        { title: '商品A', spec: '', qty: 2 },
        { title: '商品B', spec: '藍色/M', qty: 1 },
      ],
      remark: '',
      totalPrice: 1280,
      totalText: '1,280',
      trackingCode: null,
      ...overrides,
    },
    provider: 'tcat',
    labelPlan: {
      capability: 'none',
      displayText: '無物流單',
    },
  };
}

describe('renderThermalSlipHtml', () => {
  it('renders sequence number prominently', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('#001 / 003');
    expect(html).toContain('class="seq"');
  });

  it('renders order code', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('2605301537Q1M5QR');
  });

  it('renders receiver name and phone', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('王小明');
    expect(html).toContain('0912345678');
  });

  it('renders address for home delivery', () => {
    const html = renderThermalSlipHtml(makeOrder({ isCvs: false }));
    expect(html).toContain('台中市西區大墩路123號');
    expect(html).not.toContain('門市：');
  });

  it('renders cvs store info and hides address for convenience store delivery', () => {
    const html = renderThermalSlipHtml(
      makeOrder({
        isCvs: true,
        address: '台中市西區...',
        cvsStoreName: '香陽門市',
        cvsStoreNum: '268981',
      })
    );
    expect(html).toContain('香陽門市');
    expect(html).toContain('268981');
    expect(html).not.toContain('台中市西區');
  });

  it('renders normalized items and specs', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('商品A');
    expect(html).toContain('商品B');
    expect(html).toContain('藍色/M');
    expect(html).toContain('x2');
    expect(html).toContain('x1');
  });

  it('renders totalText', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('1,280');
  });

  it('renders remark when present and preserves newlines', () => {
    const html = renderThermalSlipHtml(makeOrder({ remark: '請盡快出貨\n勿折' }));
    expect(html).toContain('請盡快出貨');
    expect(html).toContain('勿折');
  });

  it('does not render remark section when remark is empty', () => {
    const html = renderThermalSlipHtml(makeOrder({ remark: '' }));
    expect(html).not.toContain('備註：');
  });

  it('renders payment and logistic status labels', () => {
    const html = renderThermalSlipHtml(makeOrder({ payStatus: 2, logStatus: 3 }));
    expect(html).toContain('已付款');
    expect(html).toContain('已出貨');
  });

  it('renders no-label status text when label capability is none', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('物流單：無物流單');
  });

  it('escapes HTML in user data', () => {
    const html = renderThermalSlipHtml(makeOrder({ receiverName: '<script>alert(1)</script>', remark: '<b>Hi</b>' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;');
  });
});
