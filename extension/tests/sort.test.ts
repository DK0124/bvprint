import { describe, it, expect } from 'vitest';
import { arrangePrintPages, arrangePrintPairs } from '../src/core/sort.js';
import type { PrintOrder } from '../src/types/index.js';

function makePrintOrder(id: number, index: number, total: number): PrintOrder {
  return {
    orderId: id,
    orderUid: `UID${id}`,
    sortIndex: index,
    printSeq: index + 1,
    printSeqText: `${String(index + 1).padStart(3, '0')} / ${String(total).padStart(3, '0')}`,
    order: {
      id,
      uid: `UID${id}`,
      createdAt: '2026-06-14T00:00:00Z',
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
      totalPrice: 1000,
      orderType: 1,
      checkoutUrl: '',
      receiverName: `收件人${id}`,
      receiverPhone: '0912345678',
      receiverAddress: '台中市西區大墩路123號',
      relateOrder: null,
      customerId: id,
      orderItems: [],
      customizeItems: [],
    },
    provider: 'tcat',
  };
}

const orders = [
  makePrintOrder(1, 0, 3),
  makePrintOrder(2, 1, 3),
  makePrintOrder(3, 2, 3),
];

describe('arrangePrintPages', () => {
  it('PAIR mode interleaves label then slip', () => {
    const pages = arrangePrintPages(orders, 'PAIR');
    expect(pages.length).toBe(6);
    expect(pages[0]).toMatchObject({ kind: 'label', order: orders[0] });
    expect(pages[1]).toMatchObject({ kind: 'slip', order: orders[0] });
    expect(pages[2]).toMatchObject({ kind: 'label', order: orders[1] });
    expect(pages[3]).toMatchObject({ kind: 'slip', order: orders[1] });
    expect(pages[4]).toMatchObject({ kind: 'label', order: orders[2] });
    expect(pages[5]).toMatchObject({ kind: 'slip', order: orders[2] });
  });

  it('LABELS_FIRST mode: all labels then all slips', () => {
    const pages = arrangePrintPages(orders, 'LABELS_FIRST');
    expect(pages.length).toBe(6);
    expect(pages[0]).toMatchObject({ kind: 'label', order: orders[0] });
    expect(pages[1]).toMatchObject({ kind: 'label', order: orders[1] });
    expect(pages[2]).toMatchObject({ kind: 'label', order: orders[2] });
    expect(pages[3]).toMatchObject({ kind: 'slip', order: orders[0] });
    expect(pages[4]).toMatchObject({ kind: 'slip', order: orders[1] });
    expect(pages[5]).toMatchObject({ kind: 'slip', order: orders[2] });
  });

  it('SLIPS_FIRST mode: all slips then all labels', () => {
    const pages = arrangePrintPages(orders, 'SLIPS_FIRST');
    expect(pages.length).toBe(6);
    expect(pages[0]).toMatchObject({ kind: 'slip', order: orders[0] });
    expect(pages[1]).toMatchObject({ kind: 'slip', order: orders[1] });
    expect(pages[2]).toMatchObject({ kind: 'slip', order: orders[2] });
    expect(pages[3]).toMatchObject({ kind: 'label', order: orders[0] });
    expect(pages[4]).toMatchObject({ kind: 'label', order: orders[1] });
    expect(pages[5]).toMatchObject({ kind: 'label', order: orders[2] });
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
