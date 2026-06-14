// ============================================================
// Shared TypeScript types for BVSHOP 出貨列印助手 Chrome Extension
// ============================================================

// ------- Real BVSHOP /order/query Types -------

export interface BvOrderRawAddress {
  zipcode?: string | number | null;
  address?: string | null;
  county?: string | null;
  town?: string | null;
  [key: string]: unknown;
}

export interface BvOrderRawCvs {
  storeName?: string | null;
  storeNum?: string | number | null;
  ReservedNo?: string | null;
  [key: string]: unknown;
}

export interface BvOrderRawLogistics {
  log_method?: string | null;
  isCVSorInStore?: boolean | null;
  [key: string]: unknown;
}

export interface BvOrderRawItem {
  title?: string | null;
  option_sort?: string | null;
  option_name?: string | null;
  quantity?: number | null;
  special_price?: number | null;
  [key: string]: unknown;
}

export interface BvOrderRaw {
  id: number;
  order_form_code: string;
  created_at: string;
  receiver_name: string;
  receiver_phone: string;
  zip_address: string;
  customer_address?: BvOrderRawAddress | null;
  customer_cvs?: BvOrderRawCvs | null;
  logistic_method: string;
  log_name?: string | null;
  logistics?: BvOrderRawLogistics | null;
  payment_method: string;
  order_pay_status: number;
  order_log_status: number;
  status: number;
  mergeOrderItems?: BvOrderRawItem[] | null;
  customize_items?: BvOrderRawItem[] | null;
  remark?: string | null;
  manage_remark?: string | null;
  total_price: number;
  totalText?: string | null;
  tracking_code?: string | null;
  submit_info?: {
    ReceiverName?: string | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
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

export interface PrintOrderItem {
  title: string;
  spec: string;
  qty: number;
}

export interface PrintOrderData {
  orderId: number;
  orderCode: string;
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
  isCvs: boolean;
  address: string;
  cvsStoreName: string;
  cvsStoreNum: string;
  logisticMethod: string;
  paymentMethod: string;
  payStatus: number;
  logStatus: number;
  orderStatus: number;
  items: PrintOrderItem[];
  remark: string;
  totalPrice: number;
  totalText: string;
  trackingCode: string | null;
}

export interface PrintOrder {
  orderId: number;
  orderCode: string;
  sortIndex: number;
  printSeq: number;
  printSeqText: string;
  order: PrintOrderData;
  provider: LogisticProvider;
}

export interface PrintSettings {
  senderName: string;
  senderPhone: string;
  paperSize: PaperSize;
  mode: PrintMode;
}

export interface SelectedIdsUpdatedMessage {
  type: 'SELECTED_IDS_UPDATED';
  orderIds: string[];
  addedCount?: number;
}

export interface FetchOrdersRequestMessage {
  type: 'FETCH_ORDERS';
  orderIds: Array<string | number>;
}

export type FetchOrdersResponse =
  | { ok: true; data: BvOrderRaw[] }
  | { ok: false; error: string };

export interface PrintRequestMessage {
  type: 'PRINT_REQUEST';
  orders: PrintOrder[];
  settings: PrintSettings;
}
