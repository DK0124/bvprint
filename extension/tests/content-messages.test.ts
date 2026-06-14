import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleContentMessage } from '../src/content/messages.js';

describe('handleContentMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches orders through the FETCH_ORDERS message branch', async () => {
    const sendResponse = vi.fn();
    const fetchOrders = vi.fn().mockResolvedValue([
      { id: 1726850, order_form_code: 'BV001' },
    ]);

    const result = handleContentMessage(
      { type: 'FETCH_ORDERS', orderIds: ['1726850'] },
      document,
      sendResponse,
      fetchOrders
    );

    expect(result).toBe(true);
    expect(fetchOrders).toHaveBeenCalledWith(['1726850']);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        data: [{ id: 1726850, order_form_code: 'BV001' }],
      });
    });
  });

  it('returns undefined for unrelated messages', () => {
    const sendResponse = vi.fn();

    expect(handleContentMessage({ type: 'UNKNOWN' }, document, sendResponse)).toBeUndefined();
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
