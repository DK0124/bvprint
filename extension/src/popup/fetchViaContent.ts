import type {
  BvOrderRaw,
  FetchOrdersResponse,
} from '../types/index.js';

const BVSHOP_BASE_URL = 'https://bvshop-manage.bvshop.tw/';
const BVSHOP_ORDER_URL = `${BVSHOP_BASE_URL}order`;
const CONTENT_SCRIPT_ERROR = '無法連線到 BVSHOP 分頁的內容腳本，請重新整理該後台分頁後再試。';

export async function findBvshopTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({});
  const bvshopTabs = tabs.filter((tab) => typeof tab.url === 'string' && tab.url.startsWith(BVSHOP_BASE_URL));
  const orderTabs = bvshopTabs.filter((tab) => tab.url?.startsWith(BVSHOP_ORDER_URL));

  return pickPreferredTab(orderTabs) ?? pickPreferredTab(bvshopTabs);
}

export async function fetchOrdersViaContentScript(
  orderIds: Array<string | number>
): Promise<{ data: BvOrderRaw[]; error?: string; noTab?: boolean }> {
  const tab = await findBvshopTab();
  if (tab?.id == null) {
    return { data: [], noTab: true };
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'FETCH_ORDERS',
      orderIds,
    }) as FetchOrdersResponse | undefined;

    if (response?.ok) {
      return { data: response.data };
    }

    return { data: [], error: response?.error ?? CONTENT_SCRIPT_ERROR };
  } catch {
    return { data: [], error: CONTENT_SCRIPT_ERROR };
  }
}

function pickPreferredTab(tabs: chrome.tabs.Tab[]): chrome.tabs.Tab | undefined {
  return tabs.find((tab) => tab.active) ?? tabs[0];
}
