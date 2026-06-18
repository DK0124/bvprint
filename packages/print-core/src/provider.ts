import type { LogisticProvider } from './types.js';

export function detectProvider(logisticMethod?: string | null): LogisticProvider {
  const text = (logisticMethod ?? '').toLowerCase();
  if (!text) return 'unknown';
  if (text.includes('黑貓') || text.includes('tcat')) return 'tcat';
  if (text.includes('順豐') || text.includes('sf')) return 'sf';
  if (text.includes('統一金流') || text.includes('payuni')) return 'payuni';
  if (text.includes('綠界') || text.includes('ecpay')) return 'ecpay';
  return 'unknown';
}
