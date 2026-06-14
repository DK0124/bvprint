export type LogisticProvider = 'ecpay' | 'payuni' | 'tcat' | 'sf' | 'unknown';

export type PrintMode = 'PAIR' | 'LABELS_FIRST' | 'SLIPS_FIRST';

export interface PrintOrder {
  orderId: number;
  orderUid: string;
  printSeqText: string;
  provider: LogisticProvider;
}

export interface PrintJob {
  jobId: string;
  createdAt: string;
  mode: PrintMode;
  paperSize: 'THERMAL_100X150' | 'A4' | 'A5' | 'ROLL_80MM';
  senderName: string;
  senderPhone: string;
  orderIds: number[];
  orders: PrintOrder[];
}

export type ShipmentLabelResult =
  | { provider: 'tcat'; status: 'ok'; pdfBytes: Uint8Array; warning?: string }
  | { provider: 'ecpay' | 'payuni'; status: 'manual'; htmlForm: string; warning?: string }
  | { provider: 'sf'; status: 'manual'; printUrl: string; warning?: string }
  | { provider: LogisticProvider; status: 'pending' | 'skipped'; warning?: string };
