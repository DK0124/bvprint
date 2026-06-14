/**
 * BVSHOP 後台 DOM 選擇器
 *
 * ⚠️  重要說明 ⚠️
 * 以下所有選擇器均為「合理推測預設值」。
 * 實際的 DOM 結構需在真實 BVSHOP 後台用 DevTools 確認後微調。
 * 操作步驟：
 *   1. 登入 https://bvshop-manage.bvshop.tw/order
 *   2. 按 F12 開啟 DevTools → Elements 面板
 *   3. 用「選取元素」工具 (Ctrl+Shift+C) 點選訂單表格/勾選框
 *   4. 確認選擇器後更新本檔案
 */

export const SELECTORS = {
  // ── 後台目標 URL pattern ──────────────────────────────
  /** Content script 注入的 URL pattern (見 manifest.json content_scripts.matches) */
  TARGET_URL_PATTERN: 'https://bvshop-manage.bvshop.tw/order*',

  // ── 訂單列表表格 ──────────────────────────────────────
  /**
   * 訂單列表的根元素（整個表格）
   * TODO: 用 DevTools 確認實際 selector
   */
  ORDER_TABLE: 'table',

  /**
   * 表格中每一筆訂單列（tr）
   * TODO: 用 DevTools 確認實際 selector
   */
  ORDER_ROW: 'tbody tr',

  /**
   * 每列的勾選框
   * TODO: 用 DevTools 確認實際 selector
   */
  ORDER_CHECKBOX: 'input[type="checkbox"]',

  // ── 每列各欄位 ────────────────────────────────────────
  // 以下 selector 相對於 ORDER_ROW

  /**
   * 訂單 ID (數字，通常在 data-* 屬性或第一欄)
   * TODO: 用 DevTools 確認實際 selector 或 data-* 屬性名稱
   * 可能是: 'td:nth-child(2)' 或 '[data-order-id]' 等
   */
  CELL_ORDER_ID: '[data-id], [data-order-id], td:nth-child(2)',

  /**
   * 訂單 UID (例如 "2407081253FRDURE")
   * TODO: 用 DevTools 確認
   */
  CELL_ORDER_UID: '[data-uid], [data-order-uid], td:nth-child(3)',

  /**
   * 收件人姓名
   * TODO: 用 DevTools 確認
   */
  CELL_RECEIVER_NAME: '[data-receiver], td:nth-child(4)',

  /**
   * 物流方式
   * TODO: 用 DevTools 確認
   */
  CELL_LOGISTIC_METHOD: '[data-logistic], td:nth-child(5)',

  /**
   * 付款方式
   * TODO: 用 DevTools 確認
   */
  CELL_PAYMENT_METHOD: '[data-payment-method], td:nth-child(6)',

  /**
   * 訂單狀態 (數字或文字)
   * TODO: 用 DevTools 確認
   */
  CELL_ORDER_STATUS: '[data-order-status], td:nth-child(7)',

  /**
   * 付款狀態
   * TODO: 用 DevTools 確認
   */
  CELL_PAYMENT_STATUS: '[data-payment-status], td:nth-child(8)',

  /**
   * 出貨狀態
   * TODO: 用 DevTools 確認
   */
  CELL_LOGISTIC_STATUS: '[data-logistic-status], td:nth-child(9)',

  // ── 注入入口按鈕 ──────────────────────────────────────
  /** 注入按鈕附加到的容器（工具列或頁面內）
   * TODO: 用 DevTools 確認工具列位置
   */
  TOOLBAR_CONTAINER: '.order-toolbar, .toolbar, .page-header, .actions, header',
} as const;

export type SelectorsType = typeof SELECTORS;
