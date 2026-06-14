import type { PrintOrderData, LabelPlan } from '../types/index.js';
import { detectProvider } from './provider.js';

/**
 * planLabel — 依訂單決定物流單列印計畫
 * MVP 階段：只有「順豐」視為可印物流單；其餘（含自訂物流/未知）一律「無物流單」。
 *
 * @param order 正規化後的訂單
 * @param origin 該訂單所在 BVSHOP 分頁的 origin（例如 'https://bvshop-manage.bv-shop.tw'）。
 *               若未提供，bvshopViewUrl 省略（呼叫端負責後續補上）。
 */
export function planLabel(order: PrintOrderData, origin?: string): LabelPlan {
  const provider = detectProvider(order.logisticMethod);
  if (provider === 'sf') {
    return {
      capability: 'sf_native',
      bvshopViewUrl: origin
        ? `${origin}/order_multi_print_sf_logistics?ids=${order.orderId}`
        : undefined,
      displayText: '順豐 10×15',
    };
  }
  return { capability: 'none', displayText: '無物流單' };
}
