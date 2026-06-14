import type { BvOrderRaw } from '../types/index.js';

/**
 * BVSHOP 後台同源 API 端點常數
 *
 * 已依真實後台校正：
 * - 主力資料來源：/order/query?order_ids=...&limit=...
 * - 同網域、零 Token，完全依賴登入 cookie
 */
export const ENDPOINTS = {
  ORDER_QUERY: '/order/query',
} as const;

export async function fetchOrdersByIds(orderIds: (number | string)[]): Promise<BvOrderRaw[]> {
  const ids = Array.from(
    new Set(
      orderIds
        .map((id) => String(id).trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    order_ids: ids.join(','),
    limit: String(Math.max(ids.length, 100)),
  });

  try {
    const response = await fetch(`${ENDPOINTS.ORDER_QUERY}?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[BVSHOP Print] fetchOrdersByIds → HTTP ${response.status}`);
      return [];
    }

    const json = await response.json();
    const data = json?.response?.data;
    return Array.isArray(data) ? (data as BvOrderRaw[]) : [];
  } catch (error) {
    console.warn('[BVSHOP Print] fetchOrdersByIds error:', error);
    return [];
  }
}

/**
 * 備用工具：用目前查詢條件撈出全部訂單 ID。
 * 保留 queryString 以沿用後台現有篩選參數，但 MVP 仍以 order_ids 精準撈取為主。
 */
export async function fetchAllOrderIds(queryString = ''): Promise<number[]> {
  const params = new URLSearchParams(queryString);
  params.set('onlyId', 'true');

  try {
    const response = await fetch(`${ENDPOINTS.ORDER_QUERY}?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[BVSHOP Print] fetchAllOrderIds → HTTP ${response.status}`);
      return [];
    }

    const json = await response.json();
    return Array.isArray(json?.response)
      ? json.response.map((id: unknown) => Number(id)).filter((id: number) => !Number.isNaN(id))
      : [];
  } catch (error) {
    console.warn('[BVSHOP Print] fetchAllOrderIds error:', error);
    return [];
  }
}
