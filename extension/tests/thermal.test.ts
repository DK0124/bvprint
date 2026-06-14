import { describe, it, expect } from 'vitest';
import { renderThermalSlipHtml } from '../src/templates/thermal.js';
import type { PrintOrder } from '../src/types/index.js';

function makeOrder(overrides: Partial<PrintOrder['order']> = {}): PrintOrder {
  return {
    orderId: 100,
    orderUid: '2407081253FRDURE',
    sortIndex: 0,
    printSeq: 1,
    printSeqText: '001 / 003',
    order: {
      id: 100,
      uid: '2407081253FRDURE',
      createdAt: '2026-06-14T10:30:00Z',
      orderStatus: 1,
      paymentStatus: 2,
      logisticStatus: 1,
      processStatus: 0,
      paymentMethod: '信用卡',
      logisticMethod: '黑貓宅急便',
      discountPrice: 0,
      companyId: 'C001',
      shippingFee: 100,
      fee: 0,
      totalPrice: 1280,
      orderType: 1,
      checkoutUrl: '',
      receiverName: '王小明',
      receiverPhone: '0912345678',
      receiverAddress: '台中市西區大墩路123號',
      relateOrder: null,
      customerId: 1,
      orderItems: [
        { id: 1, name: '商品A', qty: 2, price: 490 },
        { id: 2, name: '商品B', qty: 1, price: 300, spec: '藍色/M' },
      ],
      customizeItems: [],
      remark: null,
      cvs: null,
      ...overrides,
    },
    provider: 'tcat',
  };
}

describe('renderThermalSlipHtml', () => {
  it('renders sequence number prominently', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('#001 / 003');
    expect(html).toContain('class="seq"');
  });

  it('renders order UID', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('2407081253FRDURE');
  });

  it('renders receiver name', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('王小明');
  });

  it('renders address for home delivery (no cvs)', () => {
    const html = renderThermalSlipHtml(makeOrder({ cvs: null }));
    expect(html).toContain('台中市西區大墩路123號');
    expect(html).not.toContain('門市：');
  });

  it('renders CVS store info and hides address for convenience store delivery', () => {
    const html = renderThermalSlipHtml(
      makeOrder({
        cvs: { storeName: '7-11 公益門市', storeNum: 123456, storeBrand: 'unifart' },
        receiverAddress: '台中市西區...',
      })
    );
    expect(html).toContain('7-11 公益門市');
    expect(html).toContain('123456');
    expect(html).not.toContain('台中市西區');
  });

  it('renders orderItems and customizeItems', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('商品A');
    expect(html).toContain('x2');
    expect(html).toContain('商品B');
    expect(html).toContain('x1');
  });

  it('renders item spec', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('藍色/M');
  });

  it('renders customizeItems', () => {
    const html = renderThermalSlipHtml(
      makeOrder({
        orderItems: [],
        customizeItems: [{ id: 10, name: '客製商品', qty: 3, price: 100 }],
      })
    );
    expect(html).toContain('客製商品');
    expect(html).toContain('x3');
  });

  it('renders total price', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('1,280');
  });

  it('renders remark when present', () => {
    const html = renderThermalSlipHtml(makeOrder({ remark: '請盡快出貨' }));
    expect(html).toContain('請盡快出貨');
  });

  it('does not render remark section when remark is null', () => {
    const html = renderThermalSlipHtml(makeOrder({ remark: null }));
    expect(html).not.toContain('備註：');
  });

  it('renders payment status label (已付款)', () => {
    const html = renderThermalSlipHtml(makeOrder({ paymentStatus: 2 }));
    expect(html).toContain('已付款');
  });

  it('escapes HTML in user data', () => {
    const html = renderThermalSlipHtml(makeOrder({ receiverName: '<script>alert(1)</script>' }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders logistic method', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('黑貓宅急便');
  });

  it('renders payment method', () => {
    const html = renderThermalSlipHtml(makeOrder());
    expect(html).toContain('信用卡');
  });
});
