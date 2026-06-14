import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS, fetchOrdersByIds } from '../src/bvshop/fetcher.js';

describe('fetchOrdersByIds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds /order/query request with order_ids and credentials include', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: 'success',
        response: {
          current_page: 1,
          data: [
            { id: 1726850, order_form_code: 'A' },
          ],
        },
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchOrdersByIds(['1726850', 1726849]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith(`${ENDPOINTS.ORDER_QUERY}?`)).toBe(true);
    expect(url).toContain('order_ids=1726850%2C1726849');
    expect(url).toContain('limit=100');
    expect(init.credentials).toBe('include');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(result).toEqual([{ id: 1726850, order_form_code: 'A' }]);
  });

  it('returns empty array on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(fetchOrdersByIds(['1726850'])).resolves.toEqual([]);
  });
});
