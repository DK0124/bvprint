export const BVSHOP_HOSTS = [
  'bvshop-manage.bv-shop.tw',
  'bvshop-manage.bvshop.tw',
] as const;

export function isBvshopUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return BVSHOP_HOSTS.some((h) => parsed.host === h);
  } catch {
    return false;
  }
}

/** 從完整 url 取 origin（含 protocol+host），失敗回 undefined */
export function bvshopOriginOf(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    return BVSHOP_HOSTS.some((h) => u.host === h) ? u.origin : undefined;
  } catch {
    return undefined;
  }
}
