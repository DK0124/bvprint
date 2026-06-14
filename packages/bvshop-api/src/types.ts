export type OrderStatus = 1 | 2 | 4 | -1 | -3;
export type PaymentStatus = 1 | 2 | -1 | -4;
export type LogisticStatus = 1 | 2 | 3 | 4 | 5 | 6 | -1;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  1: '已成立',
  2: '待確認',
  4: '已完成',
  [-1]: '異常單',
  [-3]: '已取消',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  1: '未付款',
  2: '已付款',
  [-1]: '已退款',
  [-4]: '已逾期',
};

export const LOGISTIC_STATUS_LABELS: Record<LogisticStatus, string> = {
  1: '未出貨',
  2: '處理中',
  3: '已出貨',
  4: '已配達',
  5: '已取貨',
  6: '退回中',
  [-1]: '已退貨',
};

export interface BvOrderItem {
  id: number;
  productId: string;
  photo: string;
  name?: string;
  sku?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
  referralCode?: string;
  type?: 1 | 2 | 3 | 4;
  combinationId?: number;
  bookingDate?: string;
}

export interface BvInvoice {
  no?: string;
  type?: 'personal' | 'MOICA' | 'phone' | 'loveCode' | 'company';
  date?: string;
  random?: string;
  carrier?: string;
}

export interface BvOrder {
  id: number;
  uid: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  logisticStatus: LogisticStatus;
  checkoutUrl?: string;
}

export interface BvOrderDetail extends BvOrder {
  paidAt?: string | null;
  cancelAt?: string | null;
  shipmentAt?: string | null;
  shippingAt?: string | null;
  processStatus?: number;
  paymentMethod: string;
  logisticMethod: string;
  logisticTraceCode?: string | null;
  discountPrice: number;
  companyId?: string;
  shippingFee: number;
  fee: number;
  totalPrice: number;
  orderType?: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  customerId: number;
  orderItems: BvOrderItem[];
  customizeItems: BvOrderItem[];
  dealerCode?: string | null;
  remark?: string | null;
  cvs?: {
    storeName: string;
    storeNum: string | number;
    storeBrand: 'unifart' | 'fami' | 'okmart' | 'hilife';
  } | null;
  invoice?: BvInvoice | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ListOrdersParams {
  orderStatus?: string;
  paymentStatus?: string;
  logisticStatus?: string;
  customerId?: number;
  dealerCode?: string;
  dateType?: 'created' | 'paid' | 'cancel';
  startAt?: string;
  endAt?: string;
  limit?: number;
  page?: number;
  withDetail?: 0 | 1;
}

export interface CreateLabelInput {
  id: number;
  senderName: string;
  senderPhone: string;
}
