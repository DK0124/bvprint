// ============================================================
// Shared TypeScript types for BVSHOP 出貨列印助手 Chrome Extension
// Ported from packages/bvshop-api types and BVSHOP_PRINT_ASSISTANT_COPILOT_SPEC.md
// ============================================================

// ------- BVSHOP API Types -------

export interface BvOrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  sku?: string | null;
  /** e.g. size / color variants */
  spec?: string | null;
}

export interface BvCvs {
  storeName: string;
  storeNum: number;
  storeBrand: 'unifart' | 'fami' | 'okmart' | 'hilife';
}

export interface BvInvoice {
  number?: string | null;
  [key: string]: unknown;
}

/** Full order detail from /orders/{id} */
export interface BvOrderDetail {
  id: number;
  uid: string;
  createdAt: string;
  paidAt?: string | null;
  cancelAt?: string | null;
  shipmentAt?: string | null;
  shippingAt?: string | null;
  /** 1=已成立 2=待確認 4=已完成 -1=異常單 -3=已取消 */
  orderStatus: OrderStatus;
  /** 1=未付款 2=已付款 -1=已退款 -4=已逾期 */
  paymentStatus: PaymentStatus;
  /** 1=未出貨 2=處理中 3=已出貨 4=已配達 5=已取貨 6=退回中 -1=已退貨 */
  logisticStatus: LogisticStatus;
  processStatus: 0 | 1;
  paymentMethod: string;
  logisticMethod: string;
  logisticTraceCode?: string | null;
  discountPrice: number;
  companyId: string;
  shippingFee: number;
  fee: number;
  totalPrice: number;
  orderType: 1 | 2 | 3;
  checkoutUrl: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  relateOrder?: BvOrder | null;
  customerId: number;
  orderItems: BvOrderItem[];
  customizeItems: BvOrderItem[];
  dealerCode?: string | null;
  remark?: string | null;
  /** Present when logisticMethod is CVS-related */
  cvs?: BvCvs | null;
  utmData?: Record<string, unknown>;
  invoice?: BvInvoice;
}

/** Brief order info from order list */
export interface BvOrder {
  id: number;
  uid: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  logisticStatus: LogisticStatus;
  checkoutUrl: string;
}

// ------- Status Enums -------

export type OrderStatus = 1 | 2 | 4 | -1 | -3;
export type PaymentStatus = 1 | 2 | -1 | -4;
export type LogisticStatus = 1 | 2 | 3 | 4 | 5 | 6 | -1;

// ------- Provider Types -------

export type LogisticProvider = 'ecpay' | 'payuni' | 'tcat' | 'sf' | 'unknown';

// ------- Print Types -------

export type PaperSize = 'THERMAL_100X150' | 'A4' | 'A5' | 'ROLL_80MM';
export type PrintMode = 'PAIR' | 'LABELS_FIRST' | 'SLIPS_FIRST';

export interface PrintOrder {
  orderId: number;
  orderUid: string;
  sortIndex: number;
  printSeq: number;
  printSeqText: string;
  order: BvOrderDetail;
  provider: LogisticProvider;
}

export interface PrintSettings {
  senderName: string;
  senderPhone: string;
  paperSize: PaperSize;
  mode: PrintMode;
}

/** Scraped from DOM — may be partial; enriched via same-origin fetch */
export interface ScrapedOrder {
  /** Numeric order ID (may be empty string if not found) */
  orderId: string;
  /** Order UID e.g. "2407081253FRDURE" */
  orderUid: string;
  receiverName: string;
  logisticMethod: string;
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
  logisticStatus: string;
  /** Whether DOM scraping was complete */
  partial: boolean;
  /** Full detail fetched via same-origin API; null if not yet fetched */
  detail: BvOrderDetail | null;
}

/** Message sent from content script → popup */
export interface ContentToPopupMessage {
  type: 'CHECKED_ORDERS';
  orders: ScrapedOrder[];
}

/** Message sent from popup → background → print tab */
export interface PrintRequestMessage {
  type: 'PRINT_REQUEST';
  orders: PrintOrder[];
  settings: PrintSettings;
}
