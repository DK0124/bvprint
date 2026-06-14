import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOrdersViaContentScript, findBvshopTab } from '../src/popup/fetchViaContent.js';

function stubChromeTabs() {
  const query = vi.fn();
  const sendMessage = vi.fn();

  vi.stubGlobal('chrome', {
    tabs: {
      query,
      sendMessage,
    },
  });

  return { query, sendMessage };
}

describe('fetchOrdersViaContentScript', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('returns noTab when no BVSHOP tab is open', async () => {
    const { query, sendMessage } = stubChromeTabs();
    query.mockResolvedValue([
      { id: 1, url: 'https://example.com/', active: true },
    ]);

    await expect(fetchOrdersViaContentScript(['1726850'])).resolves.toEqual({
      data: [],
      noTab: true,
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns fetched data from the preferred BVSHOP order tab', async () => {
    const { query, sendMessage } = stubChromeTabs();
    const data = [{ id: 1726850, order_form_code: 'BV001' }];

    query.mockResolvedValue([
      { id: 1, url: 'https://bvshop-manage.bv-shop.tw/dashboard', active: true },
      { id: 2, url: 'https://bvshop-manage.bvshop.tw/order?page=2', active: false },
    ]);
    sendMessage.mockResolvedValue({ ok: true, data });

    await expect(fetchOrdersViaContentScript(['1726850'])).resolves.toEqual({ data });
    expect(sendMessage).toHaveBeenCalledWith(2, {
      type: 'FETCH_ORDERS',
      orderIds: ['1726850'],
    });
  });

  it('findBvshopTab supports both hosts and prefers active order tab', async () => {
    const { query } = stubChromeTabs();
    query.mockResolvedValue([
      { id: 10, url: 'https://bvshop-manage.bv-shop.tw/order?page=1', active: false },
      { id: 11, url: 'https://bvshop-manage.bvshop.tw/order?page=2', active: true },
      { id: 12, url: 'https://example.com/', active: true },
    ]);

    await expect(findBvshopTab()).resolves.toMatchObject({ id: 11 });
  });

  it('returns content-script error responses', async () => {
    const { query, sendMessage } = stubChromeTabs();
    query.mockResolvedValue([
      { id: 3, url: 'https://bvshop-manage.bv-shop.tw/order', active: true },
    ]);
    sendMessage.mockResolvedValue({ ok: false, error: '讀取失敗' });

    await expect(fetchOrdersViaContentScript(['1726850'])).resolves.toEqual({
      data: [],
      error: '讀取失敗',
    });
  });

  it('returns a refresh hint when content script messaging throws', async () => {
    const { query, sendMessage } = stubChromeTabs();
    query.mockResolvedValue([
      { id: 4, url: 'https://bvshop-manage.bvshop.tw/order', active: true },
    ]);
    sendMessage.mockRejectedValue(new Error('Receiving end does not exist.'));

    const result = await fetchOrdersViaContentScript(['1726850']);

    expect(result.data).toEqual([]);
    expect(result.error).toContain('內容腳本');
  });
});
