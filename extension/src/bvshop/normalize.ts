import type { BvOrderRaw, BvOrderRawItem, PrintOrderData, PrintOrderItem } from '../types/index.js';

export function normalizeOrder(raw: BvOrderRaw): PrintOrderData {
  const cvsStoreName = asText(raw.customer_cvs?.storeName).trim();
  const cvsStoreNum = asText(raw.customer_cvs?.storeNum).trim();
  const logMethod = asText(raw.logistics?.log_method).trim().toLowerCase();
  const isCvs = Boolean(
    cvsStoreName ||
    raw.logistics?.isCVSorInStore ||
    logMethod === 'cvs' ||
    logMethod === 'in_store'
  );

  return {
    orderId: Number(raw.id) || 0,
    orderCode: asText(raw.order_form_code).trim(),
    createdAt: asText(raw.created_at).trim(),
    receiverName: asText(raw.receiver_name || raw.submit_info?.ReceiverName).trim(),
    receiverPhone: asText(raw.receiver_phone).trim(),
    isCvs,
    address: buildAddress(raw),
    cvsStoreName,
    cvsStoreNum,
    logisticMethod: asText(raw.logistic_method).trim(),
    paymentMethod: asText(raw.payment_method).trim(),
    payStatus: Number(raw.order_pay_status) || 0,
    logStatus: Number(raw.order_log_status) || 0,
    orderStatus: Number(raw.status) || 0,
    items: normalizeItems(raw),
    remark: asText(raw.remark),
    totalPrice: Number(raw.total_price) || 0,
    totalText: asText(raw.totalText).trim() || formatPrice(raw.total_price),
    trackingCode: normalizeNullableText(raw.tracking_code),
  };
}

function normalizeItems(raw: BvOrderRaw): PrintOrderItem[] {
  const merged = (raw.mergeOrderItems ?? []).map(normalizeItem);
  const customize = (raw.customize_items ?? []).map(normalizeItem);
  return [...merged, ...customize].filter((item) => item.title || item.spec || item.qty > 0);
}

function normalizeItem(item: BvOrderRawItem): PrintOrderItem {
  return {
    title: asText(item.title).trim(),
    spec: asText(item.option_sort).trim() || asText(item.option_name).trim(),
    qty: Number(item.quantity) || 0,
  };
}

function buildAddress(raw: BvOrderRaw): string {
  const zipAddress = asText(raw.zip_address).trim();
  if (zipAddress) return zipAddress;

  const zipcode = asText(raw.customer_address?.zipcode).trim();
  const county = asText(raw.customer_address?.county).trim();
  const town = asText(raw.customer_address?.town).trim();
  const address = asText(raw.customer_address?.address).trim();

  return `${zipcode}${county}${town}${address}`.trim();
}

function formatPrice(price: number): string {
  return Number(price || 0).toLocaleString();
}

function normalizeNullableText(value: unknown): string | null {
  const text = asText(value).trim();
  return text ? text : null;
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}
