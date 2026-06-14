/**
 * Background Service Worker — BVSHOP 出貨列印助手 (MV3)
 *
 * 負責:
 * - 接收 popup 的列印請求，開新分頁顯示列印視圖
 * - 協調 content script ↔ popup 的訊息傳遞
 */

import type { PrintRequestMessage } from '../types/index.js';

// Storage key (同 content script)
const STORAGE_KEY = 'bvshop_print_checked_orders';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[BVSHOP Print] Extension installed / updated');
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_PRINT_VIEW') {
    openPrintView(message as PrintRequestMessage)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep channel open for async response
  }

  if (message?.type === 'CLEAR_ORDERS') {
    chrome.storage.local.remove(STORAGE_KEY, () => sendResponse({ ok: true }));
    return true;
  }
});

async function openPrintView(request: PrintRequestMessage): Promise<void> {
  // Encode print data as base64 URL param so the print page can read it
  const printUrl = chrome.runtime.getURL('print/index.html');
  const tab = await chrome.tabs.create({ url: printUrl, active: true });

  // Wait briefly then send the print data to the new tab
  setTimeout(async () => {
    if (tab.id == null) return;
    try {
      await chrome.tabs.sendMessage(tab.id, request);
    } catch {
      // Tab may not be ready yet — the print page also reads from storage
    }
  }, 500);

  // Also persist to storage as fallback
  await chrome.storage.local.set({ bvshop_print_request: request });
}
