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
 *   MVP 若暫無物流單，只輸出明細，保留位置供日後插入。
 *
 * LABELS_FIRST:
 *   所有物流單 → 所有明細
 *
 * SLIPS_FIRST:
 *   所有明細 → 所有物流單
 */
export function arrangePrintPages(orders: PrintOrder[], mode: PrintMode): PrintPage[] {
  const slips: PrintPage[] = orders.map((o) => ({ kind: 'slip', order: o }));
  // TODO (Plan B): labels will be real label pages from pdf-lib
  // For MVP, label pages are stubs — we only emit slips
  const labels: PrintPage[] = orders.map((o) => ({ kind: 'label', order: o }));

  switch (mode) {
    case 'LABELS_FIRST':
      return [...labels, ...slips];
    case 'SLIPS_FIRST':
      return [...slips, ...labels];
    case 'PAIR':
    default: {
      const pages: PrintPage[] = [];
      for (let i = 0; i < orders.length; i++) {
        pages.push(labels[i]);
        pages.push(slips[i]);
      }
      return pages;
    }
  }
}

/**
 * arrangePrintPairs — alias for backwards compatibility
 * Returns only the slip pages (labels are TODO)
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
