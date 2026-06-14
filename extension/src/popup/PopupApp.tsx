/**
 * PopupApp — BVSHOP 出貨列印助手 Popup
 *
 * 功能:
 * - 讀取 chrome.storage.local 累積的訂單 IDs
 * - 委由 BVSHOP 分頁內的 content script 抓取真實完整訂單資料
 * - 若尚未累積資料，fallback 直接詢問目前頁 content script 的勾選 IDs（單頁模式）
 * - 拖曳排序 + 即時流水號
 * - 列印設定 (寄件人、紙張、排序模式)
 * - 提醒已存在 tracking code 的訂單
 */

import { useState, useEffect, useRef } from 'react';
import type {
  PrintSettings,
  PrintMode,
  PaperSize,
  PrintRequestMessage,
  PrintOrderData,
  SelectedIdsUpdatedMessage,
} from '../types/index.js';
import { makePrintSeq } from '../core/sequence.js';
import { detectProvider } from '../core/provider.js';
import { planLabel } from '../core/labelPlan.js';
import { normalizeOrder } from '../bvshop/normalize.js';
import { buildPrintOrders } from '../print/renderer.js';
import { bvshopOriginOf } from '../bvshop/origin.js';
import {
  getPaymentStatusLabel,
  getLogisticStatusLabel,
} from '../bvshop/labels.js';
import {
  fetchOrdersViaContentScript,
  findBvshopTab,
} from './fetchViaContent.js';

const STORAGE_KEY_SELECTED_IDS = 'bvshop_selected_ids';
const LEGACY_STORAGE_KEY_ORDERS = 'bvshop_print_checked_orders';
const STORAGE_KEY_SETTINGS = 'bvshop_print_settings';

const DEFAULT_SETTINGS: PrintSettings = {
  senderName: '',
  senderPhone: '',
  paperSize: 'THERMAL_100X150',
  mode: 'PAIR',
};

export function PopupApp() {
  const [orders, setOrders] = useState<PrintOrderData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortedIds, setSortedIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: 'info' | 'warning' | 'error' | 'success' } | null>(null);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    void loadInitialState();
  }, []);

  useEffect(() => {
    const listener = (msg: unknown) => {
      const message = msg as SelectedIdsUpdatedMessage;
      if (message?.type === 'SELECTED_IDS_UPDATED') {
        void applySelectedIds(message.orderIds, {
          source: 'storage',
          noticeText: `✅ 已同步累積 ${message.orderIds.length} 筆（本頁新增 ${message.addedCount ?? 0} 筆）。`,
          noticeType: 'success',
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function loadInitialState() {
    setLoading(true);
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEY_SELECTED_IDS,
        LEGACY_STORAGE_KEY_ORDERS,
        STORAGE_KEY_SETTINGS,
      ]);

      const savedSettings = result[STORAGE_KEY_SETTINGS] as Partial<PrintSettings> | undefined;
      if (savedSettings) {
        setSettings((prev) => ({ ...prev, ...savedSettings }));
      }

      const storedIds = normalizeIds(result[STORAGE_KEY_SELECTED_IDS]);
      if (storedIds.length > 0) {
        await applySelectedIds(storedIds, { source: 'storage' });
        return;
      }

      await chrome.storage.local.remove(LEGACY_STORAGE_KEY_ORDERS);

      const currentPageIds = await requestCurrentPageSelectedIds();
      if (currentPageIds.length > 0) {
        await applySelectedIds(currentPageIds, {
          source: 'current-page',
          noticeText: 'ℹ️ 未偵測到累積清單，已直接讀取目前頁勾選訂單（單頁模式）。',
          noticeType: 'info',
          persist: false,
        });
        return;
      }

      setOrders([]);
      setSelectedIds([]);
      setSortedIds([]);
      setNotice({
        text: '尚未找到累積訂單，也無法直接讀取目前頁勾選。請先到 BVSHOP /order 頁勾選後，點右下角按鈕累積本頁訂單。',
        type: 'info',
      });
    } finally {
      setLoading(false);
    }
  }

  async function requestCurrentPageSelectedIds(): Promise<string[]> {
    try {
      const tab = await findBvshopTab();
      if (tab?.id == null) return [];

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_CURRENT_PAGE_SELECTED_IDS' }) as
        | { orderIds?: unknown }
        | undefined;

      return normalizeIds(response?.orderIds);
    } catch {
      return [];
    }
  }

  async function applySelectedIds(
    ids: string[],
    options: {
      source: 'storage' | 'current-page';
      noticeText?: string;
      noticeType?: 'info' | 'warning' | 'error' | 'success';
      persist?: boolean;
    }
  ) {
    const nextIds = normalizeIds(ids);
    setSelectedIds(nextIds);

    if (options.persist !== false && options.source === 'storage') {
      await chrome.storage.local.set({ [STORAGE_KEY_SELECTED_IDS]: nextIds });
    }

    if (nextIds.length === 0) {
      setOrders([]);
      setSortedIds([]);
      if (options.noticeText) {
        setNotice({ text: options.noticeText, type: options.noticeType ?? 'info' });
      }
      return;
    }

    setRefreshing(true);
    try {
      const { data: rawOrders, error, noTab } = await fetchOrdersViaContentScript(nextIds);

      if (noTab) {
        setOrders([]);
        setSortedIds([]);
        setNotice({
          text: '請先開啟並登入 BVSHOP 後台 /order 分頁，再回到這裡重新抓取。',
          type: 'warning',
        });
        return;
      }

      if (error) {
        setOrders([]);
        setSortedIds([]);
        setNotice({
          text: error,
          type: 'error',
        });
        return;
      }

      const normalizedOrders = rawOrders.map(normalizeOrder);
      const ordersById = new Map(normalizedOrders.map((order) => [String(order.orderId), order]));
      const ordered = nextIds
        .map((id) => ordersById.get(id))
        .filter((order): order is PrintOrderData => order != null);
      const missingIds = nextIds.filter((id) => !ordersById.has(id));

      setOrders(ordered);
      setSortedIds((current) => {
        const fetchedIds = ordered.map((order) => String(order.orderId));
        const kept = current.filter((id) => fetchedIds.includes(id));
        const appended = fetchedIds.filter((id) => !kept.includes(id));
        return kept.length > 0 ? [...kept, ...appended] : fetchedIds;
      });

      if (options.noticeText) {
        setNotice({ text: options.noticeText, type: options.noticeType ?? 'info' });
      } else if (missingIds.length > 0) {
        setNotice({
          text: `⚠️ 有 ${missingIds.length} 筆訂單未成功載入（ID: ${missingIds.join(', ')}）。請確認後台登入狀態後重新抓取。`,
          type: 'warning',
        });
      } else {
        setNotice({
          text: `✅ 已載入 ${ordered.length} 筆訂單資料。`,
          type: 'success',
        });
      }
    } catch (error) {
      setOrders([]);
      setSortedIds([]);
      setNotice({
        text: `❌ 讀取訂單資料失敗：${String(error)}`,
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    const ids = selectedIds.length > 0 ? selectedIds : await requestCurrentPageSelectedIds();
    await applySelectedIds(ids, {
      source: selectedIds.length > 0 ? 'storage' : 'current-page',
      noticeText: '⏳ 已重新抓取最新訂單資料。',
      noticeType: 'info',
      persist: selectedIds.length > 0,
    });
  }

  async function saveSettings(nextSettings: PrintSettings) {
    await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: nextSettings });
  }

  function updateSettings(patch: Partial<PrintSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    void saveSettings(next);
  }

  async function handlePrint() {
    if (sortedIds.length === 0 || orders.length === 0) {
      setNotice({ text: '請先在 /order 頁勾選訂單，並累積或重新抓取資料。', type: 'warning' });
      return;
    }

    const tab = await findBvshopTab();
    const printOrders = buildPrintOrders(orders, sortedIds, bvshopOriginOf(tab?.url));
    const request: PrintRequestMessage = {
      type: 'PRINT_REQUEST',
      orders: printOrders,
      settings,
    };

    await chrome.runtime.sendMessage({ type: 'OPEN_PRINT_VIEW', ...request });
    setNotice({ text: '✅ 已開啟列印視圖，請在新分頁確認後列印。', type: 'success' });
  }

  async function handleClear() {
    await chrome.storage.local.remove([STORAGE_KEY_SELECTED_IDS, LEGACY_STORAGE_KEY_ORDERS]);
    setOrders([]);
    setSelectedIds([]);
    setSortedIds([]);
    setNotice({ text: '🗑 已清除累積訂單 ID。', type: 'info' });
  }

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

  const total = sortedIds.length;
  const trackingWarnings = orders.filter((order) => order.trackingCode);

  function getOrderByIndex(index: number): PrintOrderData | undefined {
    const id = sortedIds[index];
    return orders.find((order) => String(order.orderId) === id);
  }

  function getStatusBadgeClass(status: number): string {
    if (status === 1) return 'badge badge-warning';
    if (status === 2) return 'badge badge-info';
    if (status === 3 || status === 4 || status === 5) return 'badge badge-success';
    if (status < 0) return 'badge badge-danger';
    return 'badge badge-muted';
  }

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
            <p>尚無可列印的訂單資料。</p>
            <p>請先登入 BVSHOP 後台 <strong>/order</strong>，勾選訂單後點右下角「🖨 出貨列印助手」累積本頁勾選。</p>
            <p>如果只在目前頁勾選，也可以直接開啟 popup，系統會嘗試讀取當前頁勾選作為單頁模式後備。</p>
          </div>
        ) : (
          <>
            <div className="section-title">已載入訂單（可拖曳排序）</div>
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
                    const labelPlan = planLabel(order);

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
                          {order.orderCode || id}
                          {order.trackingCode && <span className="tracking-badge" title="已有物流追蹤碼">⚠ 追蹤碼</span>}
                        </td>
                        <td>{order.receiverName || '—'}</td>
                        <td>
                          {order.logisticMethod || '—'}
                          {' '}
                          <span className="badge badge-muted" style={{ fontSize: 9 }}>{provider}</span>
                          {' '}
                          <span
                            className={`badge ${labelPlan.capability === 'none' ? 'badge-warning' : 'badge-info'}`}
                            style={{ fontSize: 9 }}
                          >
                            {labelPlan.displayText}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(order.payStatus)}>
                            {getPaymentStatusLabel(order.payStatus)}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(order.logStatus)}>
                            {getLogisticStatusLabel(order.logStatus)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#666' }}>共 {total} 筆訂單（累積 ID：{selectedIds.length}）</span>
              <button
                className="btn btn-secondary"
                style={{ flex: 'none', padding: '4px 10px', fontSize: 11 }}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? '⏳ 重新抓取中…' : '🔄 重新抓取'}
              </button>
            </div>

            {trackingWarnings.length > 0 && (
              <div className="tracking-warning-list">
                {trackingWarnings.map((order) => (
                  <div key={order.orderId} className="notice notice-warning">
                    訂單 {order.orderCode} 已有物流追蹤碼，可能已出貨/已建立物流單。
                  </div>
                ))}
              </div>
            )}
          </>
        )}

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
          ℹ️ 物流單（黑貓/順豐/綠界/PayUni）仍為 TODO；MVP 目前只列印熱感出貨明細，不會自動建立物流單。
        </div>

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
            🗑 清除累積
          </button>
        </div>
      </div>
    </>
  );
}

function normalizeIds(value: unknown): string[] {
  return Array.from(
    new Set(
      (Array.isArray(value) ? value : [])
        .map((id) => String(id).trim())
        .filter(Boolean)
    )
  );
}
