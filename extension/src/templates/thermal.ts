import type { PrintOrder } from '../types/index.js';
import { getLogisticStatusLabel, getPaymentStatusLabel } from '../bvshop/labels.js';

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

.remark .remark-text {
  white-space: pre-wrap;
  word-break: break-word;
}

footer {
  font-weight: 700;
  font-size: 12px;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export function renderThermalSlipHtml(po: PrintOrder): string {
  const { order, printSeqText } = po;
  const payStatusLabel = getPaymentStatusLabel(order.payStatus);
  const logStatusLabel = getLogisticStatusLabel(order.logStatus);
  const dateStr = order.createdAt ? order.createdAt.slice(0, 10) : '';

  const receiverHtml = `
    <section class="receiver">
      <div>收件人：${esc(order.receiverName)}</div>
      <div>電話：${esc(order.receiverPhone)}</div>
      ${order.isCvs
        ? `<div class="cvs">門市：${esc(order.cvsStoreName)} / ${esc(order.cvsStoreNum)}</div>`
        : `<div class="address">地址：${esc(order.address)}</div>`}
    </section>`;

  const itemsHtml = order.items.length > 0
    ? `<section class="items">${order.items.map((item) => `
      <div class="item">
        <div class="name">
          ${esc(item.title)}
          ${item.spec ? `<div class="spec">${esc(item.spec)}</div>` : ''}
        </div>
        <div class="qty">x${esc(String(item.qty))}</div>
      </div>`).join('')}
    </section>`
    : '';

  const remarkHtml = order.remark
    ? `<section class="remark"><div>備註：</div><div class="remark-text">${esc(order.remark)}</div></section>`
    : '';

  return `
<section class="slip slip-100x150">
  <header class="slip-header">
    <div class="seq">#${esc(printSeqText)}</div>
    <div class="title">出貨明細</div>
    <div class="order-no">訂單：${esc(order.orderCode)}</div>
    ${dateStr ? `<div class="order-date">${esc(dateStr)}</div>` : ''}
  </header>
  ${receiverHtml}
  <section class="meta">
    <div>物流：${esc(order.logisticMethod)}</div>
    <div>物流單：${esc(po.labelPlan.displayText)}</div>
    <div>付款：${esc(order.paymentMethod)} / ${esc(payStatusLabel)}</div>
    <div>出貨狀態：${esc(logStatusLabel)}</div>
  </section>
  ${itemsHtml}
  ${remarkHtml}
  <footer>總額：$${esc(order.totalText || Number(order.totalPrice).toLocaleString())}</footer>
</section>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
