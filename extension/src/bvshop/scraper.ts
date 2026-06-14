import { SELECTORS } from './selectors.js';

/**
 * 從目前頁面抓取「已勾選」的訂單 ID。
 *
 * 真實 BVSHOP 後台為 div 卡片式版面：
 * - checkbox selector: input[name="order_form_id[]"]
 * - 訂單 ID 來源: checkbox.value
 */
export function scrapeCheckedOrderIds(document: Document): string[] {
  const ids = Array.from(
    document.querySelectorAll<HTMLInputElement>(`${SELECTORS.ORDER_CHECKBOX}:checked`)
  )
    .map((input) => input.value.trim())
    .filter(Boolean);

  return Array.from(new Set(ids));
}

/**
 * Backwards-compatible alias.
 */
export const scrapeCheckedOrders = scrapeCheckedOrderIds;
