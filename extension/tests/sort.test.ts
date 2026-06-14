import { describe, it, expect } from 'vitest';
import { arrangePrintPages, arrangePrintPairs } from '../src/core/sort.js';
import type { PrintOrder } from '../src/types/index.js';

function makePrintOrder(
  id: number,
  index: number,
  total: number,
  capability: PrintOrder['labelPlan']['capability'] = 'none'
): PrintOrder {
  return {
    orderId: id,
    orderCode: `CODE${id}`,
    sortIndex: index,
    printSeq: index + 1,
    printSeqText: `${String(index + 1).padStart(3, '0')} / ${String(total).padStart(3, '0')}`,
    order: {
      orderId: id,
      orderCode: `CODE${id}`,
      createdAt: '2026-06-14 00:00:00',
      receiverName: `收件人${id}`,
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
      items: [],
      remark: '',
      totalPrice: 1000,
      totalText: '1,000',
      trackingCode: null,
    },
    provider: 'tcat',
    labelPlan: {
      capability,
      displayText: capability === 'sf_native' ? '順豐 10×15' : '無物流單',
      bvshopViewUrl: capability === 'sf_native'
        ? `https://bvshop-manage.bv-shop.tw/order_multi_print_sf_logistics?ids=${id}`
        : undefined,
    },
  };
}

const orders = [
  makePrintOrder(1, 0, 3),
  makePrintOrder(2, 1, 3),
  makePrintOrder(3, 2, 3),
];

const mixedOrders = [
  makePrintOrder(1, 0, 3, 'sf_native'),
  makePrintOrder(2, 1, 3, 'none'),
  makePrintOrder(3, 2, 3, 'sf_native'),
];

describe('arrangePrintPages', () => {
  it('PAIR mode interleaves label then slip, skipping label for none', () => {
    const pages = arrangePrintPages(mixedOrders, 'PAIR');
    expect(pages.length).toBe(5);
    expect(pages[0]).toMatchObject({ kind: 'label', order: mixedOrders[0] });
    expect(pages[1]).toMatchObject({ kind: 'slip', order: mixedOrders[0] });
    expect(pages[2]).toMatchObject({ kind: 'slip', order: mixedOrders[1] });
    expect(pages[3]).toMatchObject({ kind: 'label', order: mixedOrders[2] });
    expect(pages[4]).toMatchObject({ kind: 'slip', order: mixedOrders[2] });
  });

  it('LABELS_FIRST mode: labels with capability first, then all slips', () => {
    const pages = arrangePrintPages(mixedOrders, 'LABELS_FIRST');
    expect(pages.length).toBe(5);
    expect(pages[0]).toMatchObject({ kind: 'label', order: mixedOrders[0] });
    expect(pages[1]).toMatchObject({ kind: 'label', order: mixedOrders[2] });
    expect(pages[2]).toMatchObject({ kind: 'slip', order: mixedOrders[0] });
    expect(pages[3]).toMatchObject({ kind: 'slip', order: mixedOrders[1] });
    expect(pages[4]).toMatchObject({ kind: 'slip', order: mixedOrders[2] });
  });

  it('SLIPS_FIRST mode: all slips first, then labels with capability', () => {
    const pages = arrangePrintPages(mixedOrders, 'SLIPS_FIRST');
    expect(pages.length).toBe(5);
    expect(pages[0]).toMatchObject({ kind: 'slip', order: mixedOrders[0] });
    expect(pages[1]).toMatchObject({ kind: 'slip', order: mixedOrders[1] });
    expect(pages[2]).toMatchObject({ kind: 'slip', order: mixedOrders[2] });
    expect(pages[3]).toMatchObject({ kind: 'label', order: mixedOrders[0] });
    expect(pages[4]).toMatchObject({ kind: 'label', order: mixedOrders[2] });
  });

  it('emits only slips when all orders are none', () => {
    const pages = arrangePrintPages(orders, 'PAIR');
    expect(pages.length).toBe(3);
    expect(pages.every((page) => page.kind === 'slip')).toBe(true);
    expect(pages.map((page) => page.order.orderId)).toEqual([1, 2, 3]);
  });
});

describe('arrangePrintPairs', () => {
  it('returns orders in original order regardless of mode', () => {
    const result = arrangePrintPairs(orders, 'PAIR');
    expect(result.map((o) => o.orderId)).toEqual([1, 2, 3]);
  });

  it('LABELS_FIRST returns same order set', () => {
    const result = arrangePrintPairs(orders, 'LABELS_FIRST');
    expect(result.map((o) => o.orderId)).toEqual([1, 2, 3]);
  });

  it('SLIPS_FIRST returns same order set', () => {
    const result = arrangePrintPairs(orders, 'SLIPS_FIRST');
    expect(result.map((o) => o.orderId)).toEqual([1, 2, 3]);
  });
});
