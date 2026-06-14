import type { OrderStatus, PaymentStatus, LogisticStatus } from '../types/index.js';

/**
 * 訂單狀態中文 label
 * 1=已成立 2=待確認 4=已完成 -1=異常單 -3=已取消
 */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  1: '已成立',
  2: '待確認',
  4: '已完成',
  [-1]: '異常單',
  [-3]: '已取消',
};

/**
 * 付款狀態中文 label
 * 1=未付款 2=已付款 -1=已退款 -4=已逾期
 */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  1: '未付款',
  2: '已付款',
  [-1]: '已退款',
  [-4]: '已逾期',
};

/**
 * 出貨狀態中文 label
 * 1=未出貨 2=處理中 3=已出貨 4=已配達 5=已取貨 6=退回中 -1=已退貨
 */
export const LOGISTIC_STATUS_LABEL: Record<LogisticStatus, string> = {
  1: '未出貨',
  2: '處理中',
  3: '已出貨',
  4: '已配達',
  5: '已取貨',
  6: '退回中',
  [-1]: '已退貨',
};

export function getOrderStatusLabel(status: number): string {
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? `狀態 ${status}`;
}

export function getPaymentStatusLabel(status: number): string {
  return PAYMENT_STATUS_LABEL[status as PaymentStatus] ?? `狀態 ${status}`;
}

export function getLogisticStatusLabel(status: number): string {
  return LOGISTIC_STATUS_LABEL[status as LogisticStatus] ?? `狀態 ${status}`;
}
