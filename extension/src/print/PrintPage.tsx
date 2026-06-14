/**
 * PrintPage component — renders thermal slips in a printable view
 */
import { useState, useEffect } from 'react';
import type { PrintRequestMessage, PrintOrder } from '../types/index.js';
import { renderThermalSlipHtml, THERMAL_SLIP_CSS } from '../templates/thermal.js';
import { arrangePrintPairs } from '../core/sort.js';

export function PrintPage() {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrintRequest();
    // Also listen for message from background service worker
    const listener = (msg: unknown) => {
      const m = msg as PrintRequestMessage;
      if (m?.type === 'PRINT_REQUEST') {
        applyRequest(m);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  function applyRequest(request: PrintRequestMessage) {
    const arranged = arrangePrintPairs(request.orders, request.settings.mode);
    setOrders(arranged);
    setLoading(false);
  }

  async function loadPrintRequest() {
    try {
      const result = await chrome.storage.local.get('bvshop_print_request');
      const request = result['bvshop_print_request'] as PrintRequestMessage | undefined;
      if (request?.orders) {
        applyRequest(request);
      } else {
        setError('找不到列印資料。請回到後台頁面重新操作。');
        setLoading(false);
      }
    } catch (err) {
      setError(`載入失敗: ${String(err)}`);
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleClose() {
    window.close();
  }

  if (loading) {
    return (
      <div className="loading">
        <p>⏳ 載入列印資料中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading">
        <p style={{ color: '#c62828' }}>❌ {error}</p>
        <button onClick={handleClose}>關閉</button>
      </div>
    );
  }

  return (
    <>
      <div className="actions">
        <button onClick={handlePrint}>🖨 列印 / 另存 PDF</button>
        <button className="btn-close" onClick={handleClose}>✕ 關閉</button>
      </div>
      <div className="print-preview">
        {/* Inject slip CSS */}
        <style>{THERMAL_SLIP_CSS}</style>
        {orders.map((order) => (
          <div
            key={order.orderId}
            dangerouslySetInnerHTML={{ __html: renderThermalSlipHtml(order) }}
          />
        ))}
      </div>
      <div className="actions">
        <button onClick={handlePrint}>🖨 列印 / 另存 PDF</button>
        <button className="btn-close" onClick={handleClose}>✕ 關閉</button>
      </div>
    </>
  );
}
