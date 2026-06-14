import type { PrintOrder } from '../types/index.js';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, LOGISTIC_STATUS_LABEL } from '../bvshop/labels.js';

/** CSS for 100×150mm thermal slip (injected into print document) */
export const THERMAL_SLIP_CSS = `
@page {
  size: 100mm 150mm;
  margin: 3mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif;
  font-size: 10px;
  background: #fff;
  color: #000;
}

.slip {
  width: 100mm;
  min-height: 150mm;
  padding: 3mm;
  page-break-after: always;
}

.slip:last-child {
  page-break-after: auto;
}

.seq {
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  border: 2px solid #000;
  padding: 2mm 0;
  margin-bottom: 2mm;
  letter-spacing: 1px;
}

.title {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.order-no {
  font-size: 11px;
  text-align: center;
  margin-bottom: 2mm;
}

.order-date {
  font-size: 9px;
  text-align: center;
  color: #444;
  margin-bottom: 2mm;
}

.receiver,
.meta,
.items,
.remark,
footer {
  border-top: 1px solid #000;
  padding-top: 2mm;
  margin-top: 2mm;
}

.receiver div,
.meta div {
  margin-bottom: 1mm;
  line-height: 1.4;
}

.address {
  word-break: break-all;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 2mm;
  margin-bottom: 1.5mm;
}

.item .name {
  flex: 1;
  word-break: break-word;
  line-height: 1.3;
}

.item .spec {
  font-size: 9px;
  color: #555;
}

.item .qty {
  min-width: 14mm;
  text-align: right;
  font-weight: 700;
  white-space: nowrap;
}

footer {
  font-weight: 700;
  font-size: 12px;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/**
 * renderThermalSlipHtml — 產生單筆 100×150mm 熱感出貨明細 HTML fragment
 *
 * 顯示欄位依規格第 8 節:
 * - 流水編號 (大字置頂)
 * - 訂單編號 uid
 * - 訂單日期
 * - 收件人、電話
 * - 地址 (宅配才顯示)
 * - 超商門市 (超商才顯示)
 * - 物流方式、付款方式、付款狀態
 * - 商品明細 (orderItems + customizeItems)
 * - 訂單備註
 * - 總金額
 */
export function renderThermalSlipHtml(po: PrintOrder): string {
  const { order, printSeqText } = po;
  const isCvs = !!order.cvs;

  // Receiver section
  const receiverHtml = `
    <section class="receiver">
      <div>收件人：${esc(order.receiverName)}</div>
      <div>電話：${esc(order.receiverPhone)}</div>
      ${!isCvs ? `<div class="address">地址：${esc(order.receiverAddress)}</div>` : ''}
      ${isCvs && order.cvs ? `<div class="cvs">門市：${esc(order.cvs.storeName)} / ${esc(String(order.cvs.storeNum))}</div>` : ''}
    </section>`;

  // Meta section
  const payStatusLabel = PAYMENT_STATUS_LABEL[order.paymentStatus] ?? String(order.paymentStatus);
  const orderStatusLabel = ORDER_STATUS_LABEL[order.orderStatus] ?? String(order.orderStatus);
  const metaHtml = `
    <section class="meta">
      <div>物流：${esc(order.logisticMethod)}</div>
      <div>付款：${esc(order.paymentMethod)} / ${esc(payStatusLabel)}</div>
      <div>訂單狀態：${esc(orderStatusLabel)}</div>
    </section>`;

  // Items section
  const allItems = [...(order.orderItems ?? []), ...(order.customizeItems ?? [])];
  const itemsHtml = allItems.length > 0
    ? `<section class="items">${allItems.map((item) => `
      <div class="item">
        <div class="name">
          ${esc(item.name)}
          ${item.spec ? `<div class="spec">${esc(item.spec)}</div>` : ''}
        </div>
        <div class="qty">x${esc(String(item.qty))}</div>
      </div>`).join('')}
    </section>`
    : '';

  // Remark
  const remarkHtml = order.remark
    ? `<section class="remark">備註：${esc(order.remark)}</section>`
    : '';

  // Footer
  const footerHtml = `<footer>總額：$${Number(order.totalPrice).toLocaleString()}</footer>`;

  // Date
  const dateStr = order.createdAt ? order.createdAt.slice(0, 10) : '';

  return `
<section class="slip slip-100x150">
  <header class="slip-header">
    <div class="seq">#${esc(printSeqText)}</div>
    <div class="title">出貨明細</div>
    <div class="order-no">訂單：${esc(order.uid)}</div>
    ${dateStr ? `<div class="order-date">${esc(dateStr)}</div>` : ''}
  </header>
  ${receiverHtml}
  ${metaHtml}
  ${itemsHtml}
  ${remarkHtml}
  ${footerHtml}
</section>`;
}

/** HTML-escape a string */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * renderThermalSlipPageHtml — Wrap one or more slip fragments into a full HTML document
 */
export function renderThermalSlipPageHtml(orders: PrintOrder[]): string {
  const slips = orders.map(renderThermalSlipHtml).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>BVSHOP 出貨明細列印</title>
  <style>${THERMAL_SLIP_CSS}</style>
</head>
<body>
${slips}
</body>
</html>`;
}
