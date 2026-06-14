/**
 * PrintRenderer — 列印渲染器介面
 *
 * 方案 A (MVP): 用 window.print() + 熱感 CSS 在瀏覽器列印
 * 方案 B (TODO): 用 pdf-lib 在前端合併黑貓 raw PDF + 自繪明細，疊流水號
 */

import type { PrintOrder, PrintSettings, PrintOrderData } from '../types/index.js';
import { renderThermalSlipPageHtml } from '../templates/thermal.js';
import { arrangePrintPairs } from '../core/sort.js';
import { makePrintSeq } from '../core/sequence.js';
import { detectProvider } from '../core/provider.js';

export interface PrintRenderer {
  render(orders: PrintOrder[], settings: PrintSettings): Promise<void>;
}

export class WindowPrintRenderer implements PrintRenderer {
  async render(orders: PrintOrder[], settings: PrintSettings): Promise<void> {
    const arranged = arrangePrintPairs(orders, settings.mode);
    const html = renderThermalSlipPageHtml(arranged);
    await openPrintWindow(html);
  }
}

async function openPrintWindow(html: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
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

  await new Promise<void>((resolve) => setTimeout(resolve, 300));

  iframe.contentWindow?.print();
  setTimeout(() => iframe.remove(), 2000);
}

export class PdfLibRenderer implements PrintRenderer {
  async render(_orders: PrintOrder[], _settings: PrintSettings): Promise<void> {
    throw new Error('Plan B (pdf-lib renderer) is not yet implemented. Use WindowPrintRenderer for now.');
  }
}

export function buildPrintOrders(
  orders: PrintOrderData[],
  sortedIds: string[]
): PrintOrder[] {
  const ordered = sortedIds
    .map((id) => orders.find((order) => String(order.orderId) === id))
    .filter((order): order is PrintOrderData => order != null);

  const total = ordered.length;

  return ordered.map((order, index) => ({
    orderId: order.orderId,
    orderCode: order.orderCode,
    sortIndex: index,
    printSeq: index + 1,
    printSeqText: makePrintSeq(index, total),
    order,
    provider: detectProvider(order.logisticMethod),
  }));
}
