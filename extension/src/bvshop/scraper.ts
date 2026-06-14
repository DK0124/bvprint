/**
 * scrapeCheckedOrders — 從後台 DOM 讀取已勾選的訂單
 *
 * ⚠️  重要說明 ⚠️
 * 以下 DOM 讀取邏輯均為「合理推測預設值」。
 * 實際的 DOM 結構需在真實 BVSHOP 後台用 DevTools 確認後微調。
 */

import { SELECTORS } from './selectors.js';
import type { ScrapedOrder } from '../types/index.js';

/**
 * 從頁面 DOM 讀取「已勾選」的訂單列
 * 容錯設計：找不到欄位時標記為 partial=true，不崩潰
 */
export function scrapeCheckedOrders(document: Document): ScrapedOrder[] {
  const orders: ScrapedOrder[] = [];

  // 找所有勾選的 checkbox 所在的 tr
  // 嘗試多種策略
  const checkedInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(`${SELECTORS.ORDER_ROW} ${SELECTORS.ORDER_CHECKBOX}`)
  ).filter((input) => input.checked);

  if (checkedInputs.length === 0) {
    // 降級：嘗試直接找所有 checked checkbox
    const allChecked = Array.from(
      document.querySelectorAll<HTMLInputElement>(SELECTORS.ORDER_CHECKBOX)
    ).filter((input) => input.checked);

    for (const input of allChecked) {
      const row = input.closest('tr');
      if (row) {
        const order = extractOrderFromRow(row, input);
        if (order) orders.push(order);
      }
    }
  } else {
    for (const input of checkedInputs) {
      const row = input.closest('tr');
      if (row) {
        const order = extractOrderFromRow(row, input);
        if (order) orders.push(order);
      }
    }
  }

  return orders;
}

function extractOrderFromRow(row: Element, checkbox: HTMLInputElement): ScrapedOrder | null {
  let partial = false;

  // Try to get order ID from various sources
  const orderId = tryGet([
    () => checkbox.dataset['id'] ?? checkbox.dataset['orderId'] ?? '',
    () => row.getAttribute('data-id') ?? row.getAttribute('data-order-id') ?? '',
    () => {
      // Try each candidate selector
      const candidates = SELECTORS.CELL_ORDER_ID.split(', ');
      for (const sel of candidates) {
        const el = row.querySelector(sel.trim());
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return '';
    },
  ]);

  if (!orderId) partial = true;

  const orderUid = tryGet([
    () => row.getAttribute('data-uid') ?? row.getAttribute('data-order-uid') ?? '',
    () => {
      const candidates = SELECTORS.CELL_ORDER_UID.split(', ');
      for (const sel of candidates) {
        const el = row.querySelector(sel.trim());
        if (el?.textContent?.trim()) return el.textContent.trim();
      }
      return '';
    },
  ]);

  if (!orderUid) partial = true;

  const receiverName = safeText(row, SELECTORS.CELL_RECEIVER_NAME) ?? '';
  const logisticMethod = safeText(row, SELECTORS.CELL_LOGISTIC_METHOD) ?? '';
  const paymentMethod = safeText(row, SELECTORS.CELL_PAYMENT_METHOD) ?? '';
  const orderStatus = safeText(row, SELECTORS.CELL_ORDER_STATUS) ?? '';
  const paymentStatus = safeText(row, SELECTORS.CELL_PAYMENT_STATUS) ?? '';
  const logisticStatus = safeText(row, SELECTORS.CELL_LOGISTIC_STATUS) ?? '';

  if (!receiverName) partial = true;

  return {
    orderId,
    orderUid,
    receiverName,
    logisticMethod,
    paymentMethod,
    orderStatus,
    paymentStatus,
    logisticStatus,
    partial,
    detail: null,
  };
}

function tryGet(fns: (() => string)[]): string {
  for (const fn of fns) {
    try {
      const val = fn();
      if (val) return val;
    } catch {
      // ignore
    }
  }
  return '';
}

function safeText(row: Element, selectorList: string): string | null {
  const candidates = selectorList.split(', ');
  for (const sel of candidates) {
    try {
      const el = row.querySelector(sel.trim());
      if (el?.textContent?.trim()) return el.textContent.trim();
    } catch {
      // invalid selector — skip
    }
  }
  return null;
}
