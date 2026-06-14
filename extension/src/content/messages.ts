import { fetchOrdersByIds } from '../bvshop/fetcher.js';
import { scrapeCheckedOrderIds } from '../bvshop/scraper.js';
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

  return undefined;
}
