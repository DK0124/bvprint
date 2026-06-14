import type { BvOrderDetail } from '../types/index.js';

/**
 * BVSHOP 後台同源 API 端點常數
 *
 * ⚠️  重要說明 ⚠️
 * 以下端點路徑均為「合理推測預設值」。
 * 實際路徑需在真實後台用 DevTools (F12 → Network) 確認後微調。
 * 操作步驟：
 *   1. 登入 https://bvshop-manage.bvshop.tw/order
 *   2. 點選任一訂單
 *   3. DevTools → Network → XHR/Fetch → 找對應的訂單明細請求
 *   4. 複製實際路徑後更新 ENDPOINTS 常數
 *
 * 注意：這些是「後台前端」使用的內部 API，不是對外公開的 /api/v2。
 * 兩者可能路徑不同。若後台 XHR 是打 /api/v2/orders/{id}，就保留下方預設值。
 */
export const ENDPOINTS = {
  /** 訂單明細端點 template — {id} 會被替換為實際訂單 ID
   * TODO: 用 DevTools (Network tab) 確認真實後台 XHR 路徑
   * 可能是: /api/v2/orders/{id} 或 /api/orders/{id} 等
   */
  ORDER_DETAIL: '/api/v2/orders/{id}',

  /** 訂單列表端點 (備用)
   * TODO: 確認後台 XHR 路徑
   */
  ORDER_LIST: '/api/v2/orders',
} as const;

/**
 * fetchOrderDetail — 用同源 fetch + 登入 cookie 取得訂單明細
 *
 * 不需要任何 API Token！依賴使用者在後台已登入的 cookie/session。
 *
 * @param orderId 訂單數字 ID
 * @returns BvOrderDetail 或 null（若失敗）
 */
export async function fetchOrderDetail(orderId: number | string): Promise<BvOrderDetail | null> {
  const url = ENDPOINTS.ORDER_DETAIL.replace('{id}', String(orderId));
  try {
    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'include', // 使用登入 cookie，不需要 Token
      headers: { Accept: 'application/json' },
    });

    if (!resp.ok) {
      console.warn(`[BVSHOP Print] fetchOrderDetail ${orderId} → HTTP ${resp.status}`);
      return null;
    }

    const json = await resp.json();
    // BVSHOP API 回傳 { data: OrderDetail } 結構
    const detail: BvOrderDetail = json?.data ?? json;
    return detail;
  } catch (err) {
    console.warn(`[BVSHOP Print] fetchOrderDetail ${orderId} error:`, err);
    return null;
  }
}

/**
 * fetchOrderDetails — 批次補完訂單明細
 *
 * 對每筆訂單呼叫 fetchOrderDetail，失敗的訂單保留 null（降級策略）。
 */
export async function fetchOrderDetails(orderIds: (number | string)[]): Promise<Map<string, BvOrderDetail | null>> {
  const results = new Map<string, BvOrderDetail | null>();
  await Promise.all(
    orderIds.map(async (id) => {
      const detail = await fetchOrderDetail(id);
      results.set(String(id), detail);
    })
  );
  return results;
}
