# BVSHOP 出貨列印助手 — Chrome 擴充功能

**純前端 Chrome Extension (Manifest V3)** — 零 server、零 API Token、靠既有登入 cookie 運作。

讓商家直接在 BVSHOP 後台訂單頁勾選訂單，一鍵產生 **100×150mm 熱感出貨明細**，呼叫 `window.print()` 後另存 PDF 或直接送印表機。

---

## 架構概述

```
商家登入 BVSHOP 後台
    ↓
/order 頁面勾選訂單
    ↓
點擊「🖨 出貨列印助手」浮動按鈕 (content script 注入)
    ↓
chrome.storage.local 暫存已勾選訂單
    ↓
點擊工具列 Extension 圖示 → Popup UI
    ↓
(可選) 補完明細：同源 fetch + 登入 cookie，不需任何 Token
    ↓
拖曳排序 + 即時流水號預覽 (001 / 025)
    ↓
「產生列印」→ 新分頁列印視圖 → window.print()
    ↓
另存 PDF 或送熱感印表機
```

### 安全設計

- **零 Token**：完全不使用、不保存任何 BVSHOP API Token 或 ******
- **同源 fetch**：補完訂單明細時，用 `fetch(url, { credentials: 'include' })` 借用使用者已登入的 cookie/session，只打 `bvshop-manage.bvshop.tw`，不送往任何第三方。
- **僅暫存**：訂單明細只在記憶體 / 當次列印使用。`chrome.storage` 只存寄件人姓名、電話、紙張設定等非顧客個資。
- **最小權限**：`activeTab`、`scripting`、`storage`、`tabs`，只請求必要的 host_permissions。

---

## 安裝與載入

### 前置需求

- Node.js 18 以上（建議 20）
- npm

### 步驟

```bash
# 1. 進入 extension 目錄
cd extension

# 2. 安裝依賴
npm install

# 3. 建置（輸出到 extension/dist）
npm run build
```

### 在 Chrome 載入擴充功能

1. 開啟 Chrome，網址列輸入 `chrome://extensions`
2. 右上角開啟「**開發人員模式**」
3. 點擊「**載入未封裝項目**」
4. 選擇 `extension/dist` 資料夾
5. 擴充功能圖示 🖨 會出現在工具列

---

## 使用步驟

1. **登入** BVSHOP 後台（`https://bvshop-manage.bvshop.tw`）
2. 前往 **`/order`** 訂單頁面
3. **勾選** 要列印的訂單（可多選）
4. 點擊頁面右下角注入的「**🖨 出貨列印助手**」浮動按鈕
   - 按鈕會讀取已勾選訂單並暫存至 `chrome.storage.local`
5. 點擊工具列 Extension 圖示，開啟 **Popup UI**：
   - 可看到已勾選訂單清單與即時流水號
   - 可**拖曳排序**（序號即時更新）
   - 可點「**🔄 補完明細**」透過登入 session 取得完整商品資訊
   - 填入寄件人姓名、電話，選擇紙張與排序模式
6. 點「**🖨 產生列印**」→ 新分頁開啟列印視圖
7. 確認預覽後，點「**🖨 列印 / 另存 PDF**」→ 在瀏覽器列印對話框選擇印表機或「另存 PDF」

---

## 目錄結構

```
extension/
  popup/             # Popup HTML 入口
  print/             # 列印視圖 HTML 入口
  public/
    manifest.json    # Manifest V3
    icons/           # Extension 圖示
  src/
    types/           # 共用 TypeScript 型別 (BvOrderDetail, PrintOrder…)
    core/
      sequence.ts    # makePrintSeq ("001 / 025")
      provider.ts    # detectProvider (tcat/sf/ecpay/payuni/unknown)
      sort.ts        # arrangePrintPages/arrangePrintPairs (PAIR/LABELS_FIRST/SLIPS_FIRST)
    templates/
      thermal.ts     # renderThermalSlipHtml — 100×150mm 熱感出貨明細模板
    bvshop/
      selectors.ts   # ⚠ DOM 選擇器常數 (需用 DevTools 確認)
      fetcher.ts     # ⚠ 同源 API 端點常數 + fetchOrderDetail
      scraper.ts     # scrapeCheckedOrders — 從 DOM 讀已勾選訂單
      labels.ts      # 狀態中文 label 對照表
    content/
      index.ts       # Content Script — 注入浮動按鈕，讀勾選訂單
    background/
      index.ts       # Service Worker — 協調訊息、開列印分頁
    popup/
      PopupApp.tsx   # Popup React 元件
      main.tsx
      style.css
    print/
      PrintPage.tsx  # 列印視圖 React 元件
      renderer.ts    # WindowPrintRenderer (Plan A) + PdfLibRenderer stub (Plan B)
      main.tsx
  tests/             # Vitest 單元測試
  package.json
  tsconfig.json
  vite.config.ts
```

---

## ⚠ 需要在真實後台確認的地方

> **以下常數均為合理推測預設值，必須在真實 BVSHOP 後台用 DevTools 確認後微調。**

### 1. DOM 選擇器 — `src/bvshop/selectors.ts`

**操作步驟：**
1. 登入 `https://bvshop-manage.bvshop.tw/order`
2. 按 `F12` → **Elements** 面板
3. 點選「選取元素」工具（`Ctrl+Shift+C` / `Cmd+Shift+C`）
4. 依序點選：訂單表格、各筆訂單列（`<tr>`）、勾選框、訂單編號欄、收件人欄等
5. 確認 CSS selector 或 `data-*` 屬性名稱後，更新 `SELECTORS` 物件

**重點需確認：**
- `ORDER_TABLE` / `ORDER_ROW` — 表格與列的 selector
- `ORDER_CHECKBOX` — 勾選框 selector
- `CELL_ORDER_ID` / `CELL_ORDER_UID` — 訂單 ID 和 UID 的所在欄
- `TOOLBAR_CONTAINER` — 注入浮動按鈕的容器位置（可調整為工具列）

### 2. 同源 API 端點 — `src/bvshop/fetcher.ts`

**操作步驟：**
1. 登入後台，點進任一訂單明細頁
2. `F12` → **Network** 面板 → 篩選 XHR / Fetch
3. 找到對應的訂單明細請求
4. 複製實際的 URL 路徑（例如 `/api/v2/orders/123` 或 `/backend/orders/123`）
5. 更新 `ENDPOINTS.ORDER_DETAIL` 常數

**注意：** 後台前端內部 API 路徑可能與對外公開的 `/api/v2` 不同。

---

## 測試

```bash
# 執行單元測試（不需網路、不需登入）
npm run test
```

目前有 **39 個單元測試** 涵蓋：
- `makePrintSeq` — 流水號格式與邊界值
- `detectProvider` — 物流 provider 判斷 (黑貓/順豐/綠界/統一金流/unknown)
- `arrangePrintPages` / `arrangePrintPairs` — 三種排序模式（PAIR/LABELS_FIRST/SLIPS_FIRST）
- `renderThermalSlipHtml` — 熱感明細渲染（宅配/超商/商品/備註/HTML 轉義）
- `scrapeCheckedOrders` — DOM 解析（模擬訂單表格 HTML）

### 真實環境驗證步驟

1. 依上方「需確認」指引校正 DOM 選擇器與 API 端點
2. 在 Chrome 載入 `dist/`
3. 登入後台，前往 `/order`
4. 勾選 2~3 筆訂單
5. 點「🖨 出貨列印助手」，確認 Popup 顯示正確訂單數
6. 點「🔄 補完明細」，確認 Network 呼叫成功且明細資料完整
7. 拖曳排序，確認流水號即時更新
8. 點「🖨 產生列印」，確認列印預覽顯示 100×150mm 格式

---

## MVP 完成 vs TODO

### ✅ MVP 已完成

- [x] Content script 注入浮動按鈕，讀取 DOM 已勾選訂單
- [x] Popup UI — 訂單清單、即時流水號預覽
- [x] **拖曳排序** — HTML5 drag API，序號即時重算
- [x] 列印設定 — 寄件人、紙張尺寸、排序模式（chrome.storage 記住）
- [x] **100×150mm 熱感出貨明細** — window.print()（方案 A）
- [x] 狀態中文 label — 訂單/付款/出貨狀態
- [x] **零 Token 同源補資料骨架** — fetchOrderDetail with credentials:'include'
- [x] 安全設計 — 不保存顧客個資、不外傳任何 token
- [x] 39 個單元測試全部通過

### 🔲 TODO / 後續

- [ ] **校正 DOM 選擇器** — 需在真實後台用 DevTools 確認 (`selectors.ts`)
- [ ] **校正 API 端點** — 需確認後台內部 XHR 路徑 (`fetcher.ts`)
- [ ] **物流單產生** — 黑貓/順豐/綠界/統一金流（需使用者明確確認，防止誤建正式物流單）
- [ ] **方案 B (pdf-lib)** — 前端合併黑貓 raw PDF + 自繪明細 + 疊流水號 (`renderer.ts` 已有 stub)
- [ ] A4 / A5 / 80mm 捲紙版型（目前只有 100×150mm）
- [ ] 物流單排序模式的實際物流頁面（PAIR/LABELS_FIRST/SLIPS_FIRST 目前只影響明細順序）
- [ ] 上架 Chrome Web Store

---

## 安全說明

對應規格第 2 節：

| 原則 | 實作 |
|------|------|
| 不把 Token 寫死在程式碼 | Extension 原始碼完全不含任何 API Token 或金鑰 |
| 不把 Token commit 到 GitHub | `.gitignore` 涵蓋所有可能的 `.env` |
| 不長期保存顧客個資 | 訂單明細只在記憶體；`chrome.storage` 只存寄件人設定 |
| 同源 fetch 只打 bvshop | host_permissions 限制為 `https://bvshop-manage.bvshop.tw/*` |
| 使用者主動操作才讀取資料 | 需點擊浮動按鈕才觸發讀取 |
| 防呆：不自動建立物流單 | 物流單功能為 TODO，預覽階段絕不自動呼叫 |
