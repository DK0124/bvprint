/**
 * Background Service Worker — BVSHOP 出貨列印助手 (MV3)
 *
 * 負責:
 * - 接收 popup 的列印請求，開新分頁顯示列印視圖
 * - 協調 content script ↔ popup 的訊息傳遞
 */

import type { PrintRequestMessage, PrintOrder, PrintSettings } from '../types/index.js';

const STORAGE_KEYS = ['bvshop_selected_ids', 'bvshop_print_checked_orders'];

chrome.runtime.onInstalled.addListener(() => {
  console.log('[BVSHOP Print] Extension installed / updated');
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_PRINT_VIEW') {
    const request: PrintRequestMessage = {
      type: 'PRINT_REQUEST',
      orders: ((message as { orders?: PrintOrder[] }).orders ?? []),
      settings: ((message as { settings?: PrintSettings }).settings ?? {
        senderName: '',
        senderPhone: '',
        paperSize: 'THERMAL_100X150',
        mode: 'PAIR',
      }),
    };

    sendResponse({ ok: true });
    void openPrintView(request)
      .catch((err) => console.error('[BVSHOP Print] openPrintView failed:', err));
    return false;
  }

  if (message?.type === 'CLEAR_ORDERS') {
    chrome.storage.local.remove(STORAGE_KEYS, () => sendResponse({ ok: true }));
    return true;
  }
});

async function openPrintView(request: PrintRequestMessage): Promise<void> {
  await chrome.storage.local.set({ bvshop_print_request: request });

  const printUrl = chrome.runtime.getURL('print/index.html');
  await chrome.tabs.create({ url: printUrl, active: true });

  // print page 會自行從 storage 讀 bvshop_print_request，避免依賴 popup/訊息通道存活。
}
