/**
 * BVSHOP 後台 DOM 選擇器
 *
 * 已依真實後台校正：
 * - 目標頁面（測試/正式）：
 *   - https://bvshop-manage.bv-shop.tw/order*
 *   - https://bvshop-manage.bvshop.tw/order*
 * - 訂單勾選框：input[name="order_form_id[]"]
 *
 * 目前訂單資料以 /order/query API 為主，不再從 DOM 硬抓收件人/金額等欄位。
 * 若後台改版，請重新用 DevTools 檢查 checkbox selector 與注入位置。
 */

export const SELECTORS = {
  /** Content script 注入的 URL patterns (見 manifest.json content_scripts.matches) */
  TARGET_URL_PATTERNS: [
    'https://bvshop-manage.bv-shop.tw/order*',
    'https://bvshop-manage.bvshop.tw/order*',
  ] as const,

  /** 真實後台勾選訂單的 checkbox selector；value 即訂單 ID */
  ORDER_CHECKBOX: 'input[name="order_form_id[]"]',

  /** Content script 可附加提示或按鈕的頁面區塊；資料讀取仍以 API 為主 */
  TOOLBAR_CONTAINER: '.order-toolbar, .toolbar, .page-header, .actions, header',
} as const;

export type SelectorsType = typeof SELECTORS;
