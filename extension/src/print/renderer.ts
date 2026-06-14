/**
 * PrintRenderer — 列印渲染器介面
 *
 * 方案 A (MVP): 用 window.print() + 熱感 CSS 在瀏覽器列印
 * 方案 B (TODO): 用 pdf-lib 在前端合併黑貓 raw PDF + 自繪明細，疊流水號
 */

import type { PrintOrder, PrintSettings } from '../types/index.js';
import { renderThermalSlipPageHtml } from '../templates/thermal.js';
import { arrangePrintPairs } from '../core/sort.js';
import { makePrintSeq } from '../core/sequence.js';
import { detectProvider } from '../core/provider.js';
import type { ScrapedOrder } from '../types/index.js';

/** Abstract renderer interface — allows swapping Plan A → Plan B */
export interface PrintRenderer {
  render(orders: PrintOrder[], settings: PrintSettings): Promise<void>;
}

// ── Plan A: window.print() renderer ──────────────────────

export class WindowPrintRenderer implements PrintRenderer {
  async render(orders: PrintOrder[], settings: PrintSettings): Promise<void> {
    const arranged = arrangePrintPairs(orders, settings.mode);
    const html = renderThermalSlipPageHtml(arranged);
    await openPrintWindow(html);
  }
}

/**
 * Open a new window / iframe with the print HTML and call window.print()
 */
async function openPrintWindow(html: string): Promise<void> {
  // Use an iframe approach: inject a hidden iframe, write content, print
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    // Fallback: open new window
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for fonts / images to load
  await new Promise<void>((resolve) => setTimeout(resolve, 300));

  iframe.contentWindow?.print();

  // Remove iframe after print dialog closes
  setTimeout(() => iframe.remove(), 2000);
}

// ── Plan B: stub (TODO) ──────────────────────────────────

/**
 * TODO (Plan B): PdfLibRenderer
 *
 * When implemented, this renderer will:
 * 1. For each order, fetch the raw logistics PDF (e.g., 黑貓 base64 PDF)
 *    via same-origin fetch + credentials: 'include'
 * 2. Use pdf-lib to:
 *    a. Decode & merge logistics label PDFs
 *    b. Render thermal slip as PDF page
 *    c. Stamp sequence number (#001/025) on label page with stampSequenceOnPdf()
 *    d. Arrange pages per PrintMode (PAIR / LABELS_FIRST / SLIPS_FIRST)
 *    e. Merge all into one PDF
 * 3. Open the merged PDF in a new tab for user to save/print
 *
 * Reference: packages/print-core in the monorepo (PR #1)
 */
export class PdfLibRenderer implements PrintRenderer {
  async render(_orders: PrintOrder[], _settings: PrintSettings): Promise<void> {
    // TODO: implement Plan B
    throw new Error('Plan B (pdf-lib renderer) is not yet implemented. Use WindowPrintRenderer for now.');
  }
}

// ── Helpers ──────────────────────────────────────────────

/**
 * buildPrintOrders — Convert ScrapedOrders to PrintOrders with seq numbers
 */
export function buildPrintOrders(
  scraped: ScrapedOrder[],
  sortedIds: string[]
): PrintOrder[] {
  // Sort by provided order
  const ordered = sortedIds
    .map((id) => scraped.find((o) => o.orderId === id))
    .filter((o): o is ScrapedOrder => o != null);

  const total = ordered.length;

  return ordered.map((scraped, index) => {
    const detail = scraped.detail;
    // Build a minimal BvOrderDetail from scraped data if no detail
    const order = detail ?? buildFallbackDetail(scraped);
    const provider = detectProvider(scraped.logisticMethod || detail?.logisticMethod || '');

    return {
      orderId: Number(scraped.orderId) || 0,
      orderUid: scraped.orderUid || detail?.uid || '',
      sortIndex: index,
      printSeq: index + 1,
      printSeqText: makePrintSeq(index, total),
      order,
      provider,
    };
  });
}

import type { BvOrderDetail } from '../types/index.js';

function buildFallbackDetail(scraped: ScrapedOrder): BvOrderDetail {
  return {
    id: Number(scraped.orderId) || 0,
    uid: scraped.orderUid || '',
    createdAt: new Date().toISOString(),
    orderStatus: 1,
    paymentStatus: 1,
    logisticStatus: 1,
    processStatus: 0,
    paymentMethod: scraped.paymentMethod || '',
    logisticMethod: scraped.logisticMethod || '',
    discountPrice: 0,
    companyId: '',
    shippingFee: 0,
    fee: 0,
    totalPrice: 0,
    orderType: 1,
    checkoutUrl: '',
    receiverName: scraped.receiverName || '',
    receiverPhone: '',
    receiverAddress: '',
    relateOrder: null,
    customerId: 0,
    orderItems: [],
    customizeItems: [],
  };
}
