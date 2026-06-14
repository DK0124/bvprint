import { fetchOrdersByIds } from '../bvshop/fetcher.js';
import { scrapeCheckedOrderIds } from '../bvshop/scraper.js';
// ⚠️ DEBUG 用：調查順豐物流單可行性，不影響正式列印流程
import { probeSfLabel } from '../bvshop/sfLabelProbe.js';
import type {
  FetchOrdersRequestMessage,
  FetchOrdersResponse,
} from '../types/index.js';

type ContentMessageResponse = FetchOrdersResponse | { orderIds: string[] };

export function handleContentMessage(
  message: unknown,
  currentDocument: Document,
  sendResponse: (response: ContentMessageResponse) => void,
  fetchOrders: typeof fetchOrdersByIds = fetchOrdersByIds
): true | undefined {
  const runtimeMessage = message as { type?: string } | null | undefined;

  if (runtimeMessage?.type === 'GET_CURRENT_PAGE_SELECTED_IDS') {
    sendResponse({ orderIds: scrapeCheckedOrderIds(currentDocument) });
    return true;
  }

  if (runtimeMessage?.type === 'FETCH_ORDERS') {
    const { orderIds } = message as FetchOrdersRequestMessage;

    void (async () => {
      try {
        const data = await fetchOrders(orderIds);
        sendResponse({ ok: true, data });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();

    return true;
  }

  // ──────────────────────────────────────────────────────────
  // ⚠️  DEBUG 專用訊息（調查任務：順豐物流單可行性探測）
  //     不影響正式列印流程；驗證完成後可整段移除
  //
  // 從 popup / DevTools 傳入：
  //   chrome.runtime.sendMessage({ type: 'PROBE_SF_LABEL', orderId: 10541 })
  // ──────────────────────────────────────────────────────────
  if (runtimeMessage?.type === 'PROBE_SF_LABEL') {
    const { orderId } = message as { type: string; orderId: number | string };

    void (async () => {
      try {
        const probeResult = await probeSfLabel(orderId ?? 10541);
        sendResponse({ ok: true, data: probeResult });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();

    return true;
  }

  return undefined;
}
