export const BVSHOP_HOSTS = [
  'bvshop-manage.bv-shop.tw',
  'bvshop-manage.bvshop.tw',
] as const;

export function isBvshopUrl(url?: string): boolean {
  return !!url && BVSHOP_HOSTS.some((h) => url.includes(h));
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
