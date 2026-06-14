import type { BvOrderDetail } from '@bvprint/bvshop-api';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '@bvprint/bvshop-api';

export type PaperSize = 'THERMAL_100X150' | 'A4' | 'A5' | 'ROLL_80MM';

const THERMAL_CSS = `
  @page { size: 100mm 150mm; margin: 5mm; }
  body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
  .sheet { width: 90mm; }
  .row { margin-bottom: 4px; }
  .title { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .meta { font-size: 11px; }
  .items { margin-top: 6px; border-top: 1px solid #ddd; padding-top: 6px; }
  .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
  .label { font-weight: 700; }
  .remark { min-height: 30px; border: 1px solid #ddd; padding: 4px; }
`;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderItems(order: BvOrderDetail): string {
  const allItems = [...(order.orderItems ?? []), ...(order.customizeItems ?? [])];
  if (!allItems.length) return '<div class="item">(無商品)</div>';
  return allItems
    .map(
      (item) =>
        `<div class="item"><span>${escapeHtml(item.name ?? item.sku ?? '商品')}</span><span>x${escapeHtml(
          item.quantity ?? 1,
        )}</span></div>`,
    )
    .join('');
}

export function renderThermalSlipHtml(
  order: BvOrderDetail,
  seqText: string,
  paperSize: PaperSize = 'THERMAL_100X150',
): string {
  const paymentStatusText = PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ?? String(order.paymentStatus);
  const hasCvs = Boolean(order.cvs?.storeName || order.cvs?.storeNum);

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>BVSHOP 出貨明細</title>
  <style>${THERMAL_CSS}</style>
</head>
<body data-paper-size="${paperSize}">
  <div class="sheet">
    <div class="title">BVSHOP 出貨明細</div>
    <div class="row"><span class="label">流水編號：</span>${escapeHtml(seqText)}</div>
    <div class="row"><span class="label">訂單編號：</span>${escapeHtml(order.uid)}</div>
    <div class="row"><span class="label">訂單日期：</span>${escapeHtml(order.createdAt)}</div>
    <div class="row"><span class="label">收件人：</span>${escapeHtml(order.receiverName)}</div>
    <div class="row"><span class="label">電話：</span>${escapeHtml(order.receiverPhone)}</div>
    ${hasCvs ? '' : `<div class="row"><span class="label">地址：</span>${escapeHtml(order.receiverAddress)}</div>`}
    ${
      hasCvs
        ? `<div class="row"><span class="label">超商門市：</span>${escapeHtml(order.cvs?.storeName)} (${escapeHtml(
            order.cvs?.storeNum,
          )})</div>`
        : ''
    }
    <div class="row"><span class="label">物流方式：</span>${escapeHtml(order.logisticMethod)}</div>
    <div class="row"><span class="label">付款方式：</span>${escapeHtml(order.paymentMethod)}</div>
    <div class="row"><span class="label">付款狀態：</span>${escapeHtml(paymentStatusText)}</div>

    <div class="items">
      <div class="label">商品明細</div>
      ${renderItems(order)}
    </div>

    <div class="row"><span class="label">訂單備註：</span></div>
    <div class="remark">${escapeHtml(order.remark ?? '')}</div>
    <div class="row meta"><span class="label">總金額：</span>${escapeHtml(order.totalPrice)}</div>
  </div>
</body>
</html>`;
}

export const thermalSlipCss = THERMAL_CSS;
