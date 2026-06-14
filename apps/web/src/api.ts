import type { OrderRow } from './types.js';

export async function fetchOrders(filters: Record<string, string>): Promise<OrderRow[]> {
  const qs = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/orders?${qs}`);
  if (!response.ok) {
    throw new Error(`讀取訂單失敗: ${response.status}`);
  }
  const json = (await response.json()) as { data: OrderRow[] };
  return json.data ?? [];
}

export async function createPrintJob(payload: {
  orderIds: number[];
  senderName: string;
  senderPhone: string;
  paperSize: 'THERMAL_100X150' | 'A4' | 'A5' | 'ROLL_80MM';
  mode: 'PAIR' | 'LABELS_FIRST' | 'SLIPS_FIRST';
}) {
  const response = await fetch('/api/print-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('建立列印任務失敗');
  return response.json() as Promise<{ jobId: string; warnings?: string[] }>;
}

export async function generatePdf(jobId: string, confirmCreateLabels = true): Promise<Blob> {
  const response = await fetch(`/api/print-jobs/${jobId}/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmCreateLabels }),
  });
  if (!response.ok) throw new Error('產生 PDF 失敗');
  return response.blob();
}
