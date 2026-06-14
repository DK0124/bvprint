import type { LogisticProvider } from '../types/index.js';

/**
 * detectProvider — 依物流方式字串判斷 provider
 * MVP 以字串比對為主，後續可改為設定頁對照表。
 */
export function detectProvider(logisticMethod: string): LogisticProvider {
  const text = logisticMethod.toLowerCase();

  if (text.includes('黑貓') || text.includes('tcat')) return 'tcat';
  if (text.includes('順豐') || text.includes('sf express') || text.includes('sf_express')) return 'sf';
  if (text.includes('統一金流') || text.includes('payuni')) return 'payuni';
  if (text.includes('綠界') || text.includes('ecpay')) return 'ecpay';

  return 'unknown';
}
