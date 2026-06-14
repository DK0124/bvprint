/**
 * Content Script — BVSHOP 出貨列印助手
 *
 * 注入到: https://bvshop-manage.bvshop.tw/order*
 *
 * 功能:
 * 1. 注入「🖨 出貨列印助手」浮動按鈕到後台頁面
 * 2. 點擊時讀取已勾選訂單 (scrapeCheckedOrders)
 * 3. 將訂單資料發送給 popup (透過 chrome.storage.local 暫存)
 *
 * ⚠️  DOM 選擇器需在真實後台用 DevTools 確認後微調
 *    (見 src/bvshop/selectors.ts)
 */

import { scrapeCheckedOrders } from '../bvshop/scraper.js';
import type { ContentToPopupMessage, ScrapedOrder } from '../types/index.js';

const BUTTON_ID = 'bvshop-print-assistant-btn';
const STORAGE_KEY = 'bvshop_print_checked_orders';

/** Inject the floating print button if not already present */
function injectPrintButton(): void {
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '🖨 出貨列印助手';
  btn.title = 'BVSHOP 出貨列印助手 — 點擊讀取已勾選訂單';

  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '99999',
    padding: '10px 16px',
    background: '#2962ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '0.5px',
    lineHeight: '1.4',
  });

  btn.addEventListener('click', handlePrintButtonClick);
  document.body.appendChild(btn);
}

async function handlePrintButtonClick(): Promise<void> {
  const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = '⏳ 讀取中…';
    btn.disabled = true;
  }

  try {
    const orders: ScrapedOrder[] = scrapeCheckedOrders(document);

    if (orders.length === 0) {
      showNotice('❗ 請先勾選至少一筆訂單', 'warning');
      return;
    }

    // Store in chrome.storage.local so popup can read it
    const msg: ContentToPopupMessage = { type: 'CHECKED_ORDERS', orders };
    await chrome.storage.local.set({ [STORAGE_KEY]: msg });

    // Also send a message to any open extension popup
    try {
      await chrome.runtime.sendMessage(msg);
    } catch {
      // Popup may not be open — that's fine, storage is the fallback
    }

    showNotice(`✅ 已讀取 ${orders.length} 筆勾選訂單，請開啟擴充功能圖示`, 'success');
  } catch (err) {
    console.error('[BVSHOP Print] scrapeCheckedOrders error:', err);
    showNotice('❌ 讀取訂單時發生錯誤，請開啟 DevTools 查看詳情', 'error');
  } finally {
    if (btn) {
      btn.textContent = '🖨 出貨列印助手';
      btn.disabled = false;
    }
  }
}

function showNotice(text: string, type: 'success' | 'warning' | 'error'): void {
  const notice = document.createElement('div');
  const colors = { success: '#2e7d32', warning: '#f57c00', error: '#c62828' };
  Object.assign(notice.style, {
    position: 'fixed',
    bottom: '80px',
    right: '24px',
    zIndex: '99999',
    padding: '10px 16px',
    background: colors[type],
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    maxWidth: '320px',
    lineHeight: '1.5',
  });
  notice.textContent = text;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 4000);
}

// ── Init ──────────────────────────────────────────────────

function init(): void {
  // Wait for body to be available
  if (document.body) {
    injectPrintButton();
  } else {
    document.addEventListener('DOMContentLoaded', injectPrintButton);
  }

  // Re-inject if SPA navigation replaces the button
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectPrintButton();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

init();
