/**
 * PopupApp — BVSHOP 出貨列印助手 Popup
 *
 * 功能:
 * - 顯示從 content script 傳來的已勾選訂單清單
 * - 拖曳排序 + 即時流水號
 * - 列印設定 (寄件人、紙張、排序模式)
 * - 補完訂單明細 (同源 fetch)
 * - 產生列印按鈕
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ScrapedOrder,
  PrintSettings,
  PrintMode,
  PaperSize,
  PrintRequestMessage,
} from '../types/index.js';
import { makePrintSeq } from '../core/sequence.js';
import { detectProvider } from '../core/provider.js';
import { fetchOrderDetail } from '../bvshop/fetcher.js';
import { buildPrintOrders } from '../print/renderer.js';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getLogisticStatusLabel,
} from '../bvshop/labels.js';

const STORAGE_KEY_ORDERS = 'bvshop_print_checked_orders';
const STORAGE_KEY_SETTINGS = 'bvshop_print_settings';

const DEFAULT_SETTINGS: PrintSettings = {
  senderName: '',
  senderPhone: '',
  paperSize: 'THERMAL_100X150',
  mode: 'PAIR',
};

export function PopupApp() {
  const [orders, setOrders] = useState<ScrapedOrder[]>([]);
  const [sortedIds, setSortedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ── Load initial data ──────────────────────────────────
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Listen for content script messages
  useEffect(() => {
    const listener = (msg: unknown) => {
      const m = msg as { type: string; orders?: ScrapedOrder[] };
      if (m?.type === 'CHECKED_ORDERS' && m.orders) {
        applyOrders(m.orders);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function loadFromStorage() {
    setLoading(true);
    try {
      const result = await chrome.storage.local.get([STORAGE_KEY_ORDERS, STORAGE_KEY_SETTINGS]);
      const msg = result[STORAGE_KEY_ORDERS] as { type: string; orders: ScrapedOrder[] } | undefined;
      if (msg?.orders) applyOrders(msg.orders);

      const saved = result[STORAGE_KEY_SETTINGS] as Partial<PrintSettings> | undefined;
      if (saved) setSettings((prev) => ({ ...prev, ...saved }));
    } finally {
      setLoading(false);
    }
  }

  function applyOrders(newOrders: ScrapedOrder[]) {
    setOrders(newOrders);
    setSortedIds(newOrders.map((o) => o.orderId));
    const hasPartial = newOrders.some((o) => o.partial);
    if (hasPartial) {
      setNotice({
        text: '部分訂單資料不完整（⚠），點「補完明細」可嘗試透過登入 session 取得完整資料。',
        type: 'warning',
      });
    }
  }

  // ── Settings persistence ───────────────────────────────
  async function saveSettings(s: PrintSettings) {
    await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: s });
  }

  function updateSettings(patch: Partial<PrintSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  // ── Fetch detail ───────────────────────────────────────
  async function handleFetchDetail() {
    setFetchingDetail(true);
    setNotice({ text: '⏳ 正在補完訂單明細…', type: 'info' });

    let successCount = 0;
    let failCount = 0;

    const updated = await Promise.all(
      orders.map(async (order) => {
        if (order.detail) return order; // already fetched
        if (!order.orderId) { failCount++; return order; }
        const detail = await fetchOrderDetail(order.orderId);
        if (detail) {
          successCount++;
          return { ...order, detail, partial: false };
        } else {
          failCount++;
          return order;
        }
      })
    );

    setOrders(updated);
    setFetchingDetail(false);

    if (failCount === 0) {
      setNotice({ text: `✅ 已補完全部 ${successCount} 筆訂單明細`, type: 'success' });
    } else {
      setNotice({
        text: `⚠ 已補完 ${successCount} 筆，${failCount} 筆失敗（可能需確認登入狀態或 API 路徑）`,
        type: 'warning',
      });
    }
  }

  // ── Print ──────────────────────────────────────────────
  async function handlePrint() {
    if (sortedIds.length === 0) {
      setNotice({ text: '請先到 BVSHOP 後台勾選訂單', type: 'warning' });
      return;
    }

    const printOrders = buildPrintOrders(orders, sortedIds);
    const request: PrintRequestMessage = {
      type: 'PRINT_REQUEST',
      orders: printOrders,
      settings,
    };

    await chrome.runtime.sendMessage({ type: 'OPEN_PRINT_VIEW', ...request });
    setNotice({ text: '✅ 已開啟列印視圖，請在新分頁確認後列印', type: 'success' });
  }

  // ── Clear ──────────────────────────────────────────────
  async function handleClear() {
    await chrome.runtime.sendMessage({ type: 'CLEAR_ORDERS' });
    await chrome.storage.local.remove(STORAGE_KEY_ORDERS);
    setOrders([]);
    setSortedIds([]);
    setNotice(null);
  }

  // ── Drag & Drop ────────────────────────────────────────
  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(dropIndex: number) {
    const fromIndex = dragIndexRef.current;
    if (fromIndex == null || fromIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const next = [...sortedIds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, moved);
    setSortedIds(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  // ── Render helpers ─────────────────────────────────────
  const total = sortedIds.length;

  function getOrderByIndex(index: number): ScrapedOrder | undefined {
    const id = sortedIds[index];
    return orders.find((o) => o.orderId === id);
  }

  function getStatusBadgeClass(status: string): string {
    const n = Number(status);
    // logistic status
    if (n === 1) return 'badge badge-warning';
    if (n === 2) return 'badge badge-info';
    if (n === 3 || n === 4 || n === 5) return 'badge badge-success';
    if (n < 0) return 'badge badge-danger';
    return 'badge badge-muted';
  }

  // ── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="popup-header">
        <span>🖨</span> BVSHOP 出貨列印助手
        <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>載入中…</div>
      </div>
    );
  }

  return (
    <>
      <div className="popup-header">
        <span>🖨</span> BVSHOP 出貨列印助手
      </div>
      <div className="popup-body">
        {notice && (
          <div className={`notice notice-${notice.type}`}>{notice.text}</div>
        )}

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>尚無勾選訂單。</p>
            <p>請先登入 BVSHOP 後台，前往 <strong>/order</strong> 頁面，勾選訂單後點擊頁面右下角「🖨 出貨列印助手」按鈕。</p>
          </div>
        ) : (
          <>
            <div className="section-title">已勾選訂單（可拖曳排序）</div>
            <div className="order-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>⠿</th>
                    <th>流水號</th>
                    <th>訂單編號</th>
                    <th>收件人</th>
                    <th>物流方式</th>
                    <th>付款狀態</th>
                    <th>出貨狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedIds.map((id, index) => {
                    const order = getOrderByIndex(index);
                    if (!order) return null;
                    const seqText = makePrintSeq(index, total);
                    const provider = detectProvider(order.logisticMethod);
                    const payLabel = order.detail
                      ? getPaymentStatusLabel(order.detail.paymentStatus)
                      : order.paymentStatus;
                    const logLabel = order.detail
                      ? getLogisticStatusLabel(order.detail.logisticStatus)
                      : order.logisticStatus;

                    return (
                      <tr
                        key={id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className={dragOverIndex === index ? 'drag-over' : ''}
                      >
                        <td className="drag-handle" title="拖曳排序">⠿</td>
                        <td className="seq-cell">#{seqText}</td>
                        <td>
                          {order.orderUid || id}
                          {order.partial && <span className="partial-badge" title="資料不完整">⚠</span>}
                        </td>
                        <td>{order.receiverName || '—'}</td>
                        <td>
                          {order.logisticMethod || '—'}
                          {' '}
                          <span className="badge badge-muted" style={{ fontSize: 9 }}>{provider}</span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(order.paymentStatus)}>
                            {payLabel}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(order.logisticStatus)}>
                            {logLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#666' }}>共 {total} 筆訂單</span>
              <button
                className="btn btn-secondary"
                style={{ flex: 'none', padding: '4px 10px', fontSize: 11 }}
                onClick={handleFetchDetail}
                disabled={fetchingDetail}
              >
                {fetchingDetail ? '⏳ 補完中…' : '🔄 補完明細'}
              </button>
            </div>
          </>
        )}

        {/* ── Settings ── */}
        <div className="section-title" style={{ marginTop: 14 }}>列印設定</div>
        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="senderName">寄件人姓名</label>
            <input
              id="senderName"
              type="text"
              value={settings.senderName}
              placeholder="店家名稱"
              onChange={(e) => updateSettings({ senderName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="senderPhone">寄件人電話</label>
            <input
              id="senderPhone"
              type="text"
              value={settings.senderPhone}
              placeholder="0912345678"
              onChange={(e) => updateSettings({ senderPhone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="paperSize">紙張尺寸</label>
            <select
              id="paperSize"
              value={settings.paperSize}
              onChange={(e) => updateSettings({ paperSize: e.target.value as PaperSize })}
            >
              <option value="THERMAL_100X150">熱感 100×150mm（預設）</option>
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="ROLL_80MM">80mm 捲紙</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="printMode">排序模式</label>
            <select
              id="printMode"
              value={settings.mode}
              onChange={(e) => updateSettings({ mode: e.target.value as PrintMode })}
            >
              <option value="PAIR">PAIR — 物流單+明細成對（預設）</option>
              <option value="LABELS_FIRST">LABELS_FIRST — 全部物流單→全部明細</option>
              <option value="SLIPS_FIRST">SLIPS_FIRST — 全部明細→全部物流單</option>
            </select>
          </div>
        </div>

        <div className="notice notice-info" style={{ marginTop: 8, fontSize: 11 }}>
          ℹ️ 物流單（黑貓/順豐/綠界/統一金流）為 TODO，MVP 目前只列印熱感出貨明細。
        </div>

        {/* ── Actions ── */}
        <div className="action-bar">
          <button
            className="btn btn-primary"
            onClick={handlePrint}
            disabled={orders.length === 0}
          >
            🖨 產生列印
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
          >
            🗑 清除
          </button>
        </div>
      </div>
    </>
  );
}
