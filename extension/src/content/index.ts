/**
 * Content Script — BVSHOP 出貨列印助手
 *
 * 注入到: https://bvshop-manage.bvshop.tw/order*
 *
 * 功能:
 * 1. 注入「🖨 出貨列印助手」浮動按鈕到後台頁面
 * 2. 點擊時讀取目前頁面已勾選的 order IDs
 * 3. 合併去重後存到 chrome.storage.local，供 popup 跨頁累積使用
 * 4. 回應 popup 對「目前頁勾選」的即時查詢（單頁模式 fallback）
 */

import { scrapeCheckedOrderIds } from '../bvshop/scraper.js';
import type { SelectedIdsUpdatedMessage } from '../types/index.js';
import { handleContentMessage } from './messages.js';

const BUTTON_ID = 'bvshop-print-assistant-btn';
const STORAGE_KEY_SELECTED_IDS = 'bvshop_selected_ids';

function injectPrintButton(): void {
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.textContent = '🖨 出貨列印助手';
  btn.title = '累積本頁勾選訂單，供 popup 跨頁列印使用';

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
    btn.textContent = '⏳ 累積中…';
    btn.disabled = true;
  }

  try {
    const currentIds = scrapeCheckedOrderIds(document);

    if (currentIds.length === 0) {
      showNotice('❗ 請先勾選至少一筆訂單', 'warning');
      return;
    }

    const result = await chrome.storage.local.get(STORAGE_KEY_SELECTED_IDS);
    const existingIds = normalizeStoredIds(result[STORAGE_KEY_SELECTED_IDS]);
    const mergedIds = mergeUniqueIds(existingIds, currentIds);
    const addedCount = mergedIds.length - existingIds.length;

    await chrome.storage.local.set({ [STORAGE_KEY_SELECTED_IDS]: mergedIds });

    const message: SelectedIdsUpdatedMessage = {
      type: 'SELECTED_IDS_UPDATED',
      orderIds: mergedIds,
      addedCount,
    };

    try {
      await chrome.runtime.sendMessage(message);
    } catch {
      // Popup may not be open — storage remains the source of truth.
    }

    showNotice(
      `✅ 已累積 ${mergedIds.length} 筆（本頁新增 ${addedCount} 筆）。切換頁面後可再次點擊累積，完成後開啟擴充列印。`,
      'success'
    );
  } catch (err) {
    console.error('[BVSHOP Print] accumulate selected order ids error:', err);
    showNotice('❌ 累積訂單時發生錯誤，請開啟 DevTools 查看詳情', 'error');
  } finally {
    if (btn) {
      btn.textContent = '🖨 出貨列印助手';
      btn.disabled = false;
    }
  }
}

function mergeUniqueIds(existingIds: string[], nextIds: string[]): string[] {
  const seen = new Set(existingIds);
  const merged = [...existingIds];

  for (const id of nextIds) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }

  return merged;
}

function normalizeStoredIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((id) => String(id).trim()).filter(Boolean)
    : [];
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
    maxWidth: '360px',
    lineHeight: '1.5',
  });
  notice.textContent = text;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 4500);
}

function registerMessageHandler(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    return handleContentMessage(message, document, sendResponse);
  });
}

function init(): void {
  if (document.body) {
    injectPrintButton();
  } else {
    document.addEventListener('DOMContentLoaded', injectPrintButton);
  }

  registerMessageHandler();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectPrintButton();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

init();
