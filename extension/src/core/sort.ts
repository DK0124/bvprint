import type { PrintOrder, PrintMode } from '../types/index.js';

/**
 * PrintPage represents one page in the final print output.
 * kind = 'slip'  → 熱感出貨明細
 * kind = 'label' → 物流單 (placeholder for Plan B / TODO)
 */
export interface PrintPage {
  kind: 'slip' | 'label';
  order: PrintOrder;
}

/**
 * arrangePrintPages — 依排序模式決定列印頁面順序
 *
 * PAIR (預設):
 *   #001 物流單 → #001 明細 → #002 物流單 → #002 明細 …
 *   無物流單時跳過該筆物流單頁，明細仍照印。
 *
 * LABELS_FIRST:
 *   所有可列印物流單 → 所有明細
 *
 * SLIPS_FIRST:
 *   所有明細 → 所有可列印物流單
 */
export function arrangePrintPages(orders: PrintOrder[], mode: PrintMode): PrintPage[] {
  const slips: PrintPage[] = orders.map((o) => ({ kind: 'slip', order: o }));
  const labels: PrintPage[] = orders
    .filter((o) => o.labelPlan.capability !== 'none')
    .map((o) => ({ kind: 'label', order: o }));

  switch (mode) {
    case 'LABELS_FIRST':
      return [...labels, ...slips];
    case 'SLIPS_FIRST':
      return [...slips, ...labels];
    case 'PAIR':
    default: {
      const pages: PrintPage[] = [];
      for (const order of orders) {
        if (order.labelPlan.capability !== 'none') {
          pages.push({ kind: 'label', order });
        }
        pages.push({ kind: 'slip', order });
      }
      return pages;
    }
  }
}

/**
 * arrangePrintPairs — alias for backwards compatibility
 * Returns only the slip pages (all orders remain included)
 */
export function arrangePrintPairs(orders: PrintOrder[], mode: PrintMode): PrintOrder[] {
  const pages = arrangePrintPages(orders, mode);
  // For MVP return orders in the order slips appear
  const seen = new Set<number>();
  const result: PrintOrder[] = [];
  for (const page of pages) {
    if (page.kind === 'slip' && !seen.has(page.order.orderId)) {
      seen.add(page.order.orderId);
      result.push(page.order);
    }
  }
  return result;
}
