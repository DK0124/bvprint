# BVSHOP 出貨列印助手 — Chrome 擴充功能

**純前端 Chrome Extension (Manifest V3)** — 零 server、零 API Token，完全依賴 BVSHOP 後台既有登入 cookie。

目前已依真實後台 `https://bvshop-manage.bvshop.tw/order` 校正：

- checkbox selector：`input[name="order_form_id[]"]`
- 訂單 ID 來源：checkbox `value`
- 訂單資料來源：`/order/query?order_ids=...&limit=...`
- 對 BVSHOP 的 `fetch` 一律使用 `credentials: 'include'`

---

## 架構概述

```text
商家登入 BVSHOP 後台
    ↓
/order 頁勾選訂單
    ↓
每換一頁都點一次右下角「🖨 出貨列印助手」累積本頁勾選
    ↓
chrome.storage.local 暫存累積的 order IDs
    ↓
點擊工具列 Extension 圖示 → Popup UI
    ↓
Popup 用 /order/query?order_ids=... 重新抓回完整訂單資料
    ↓
拖曳排序 + 即時流水號預覽 (001 / 025)
    ↓
「產生列印」→ 新分頁列印視圖 → window.print()
    ↓
另存 PDF 或送熱感印表機
```

### 安全設計

- **零 Token**：原始碼與執行流程都不使用 ******
- **同源 cookie**：所有 BVSHOP API 呼叫都使用 `fetch(..., { credentials: 'include' })`。
- **最小範圍**：只打 `https://bvshop-manage.bvshop.tw/*`。
- **不自動建物流單**：黑貓 / 順豐 / 綠界 / PayUni 物流單仍為 TODO。

---

## 安裝與載入

```bash
cd extension
npm install
npm run build
```

Chrome 載入步驟：

1. 開啟 `chrome://extensions`
2. 開啟「開發人員模式」
3. 點「載入未封裝項目」
4. 選擇 `extension/dist`

---

## 使用流程（已校正）

1. 登入 BVSHOP 後台，前往 `https://bvshop-manage.bvshop.tw/order`
2. 勾選訂單（可跨頁）
3. **每換一頁勾選後，都點一次右下角「🖨 出貨列印助手」**，累積本頁勾選 ID
4. 重複直到所有頁面都累積完成
5. 點工具列擴充圖示開啟 popup
6. popup 會自動讀取累積 ID，並用 `order/query?order_ids=...` 抓回完整資料
7. 可拖曳排序、即時預覽流水號、填寄件人資訊
8. 點「🖨 產生列印」→ 新分頁列印 → 另存 PDF
9. 需要重來時，點 popup 內「🗑 清除累積」

### 單頁模式 fallback

如果你只在目前頁勾選、尚未按右下角累積按鈕就直接開 popup：

- popup 會嘗試向 active tab 的 content script 讀取「目前頁勾選 ID」
- 這樣單頁勾選仍可直接列印

### 為什麼需要「累積本頁勾選」？

BVSHOP 後台可跨頁勾選，但目前頁 DOM 只能看到當頁 checkbox；後台也沒有把跨頁勾選清單放在 localStorage。  
因此 MVP 採用擴充功能自行累積 `order_ids` 的方式，確保跨頁勾選後仍能準確列印。

---

## 真實後台校正結果

### DOM selector

- 目標頁面：`https://bvshop-manage.bvshop.tw/order*`
- checkbox selector：`input[name="order_form_id[]"]`
- 已勾選 selector：`input[name="order_form_id[]"]:checked`
- 訂單 ID：checkbox `value`

### API

主力端點：

```text
GET /order/query?order_ids=1726850,1726849,...&limit=100
```

特性：

- 不帶 Token
- 需 `credentials: 'include'`
- 回傳格式：

```json
{
  "result": "success",
  "response": {
    "current_page": 1,
    "data": [{ "...": "..." }]
  }
}
```

備用端點（可選）：

```text
GET /order/query?onlyId=true&...
```

---

## 目前列印欄位

熱感出貨明細使用正規化後欄位：

- 流水號 `#001 / 008`
- 訂單編號 `orderCode`
- 日期 `createdAt`
- 收件人 / 電話
- 超商門市或宅配地址（二擇一）
- 物流方式
- 付款方式 + 付款狀態
- 出貨狀態
- 商品明細
- 備註 `remark`（純文字 escape，不顯示 `manage_remark`）
- 總額 `totalText`

若訂單已有 `tracking_code`，popup 會顯示警告：

> 訂單 {orderCode} 已有物流追蹤碼，可能已出貨/已建立物流單。

---

## 測試

```bash
npm run test
npm run build
```

目前單元測試涵蓋：

- `scrapeCheckedOrderIds`：真實 checkbox 結構、checked 過濾、去重
- `normalizeOrder`：超商 / 宅配欄位對應、地址 / 門市選擇、items、remark、totalText
- `fetchOrdersByIds`：`order_ids` URL 組裝、`credentials: 'include'`、`response.data` 解析
- `makePrintSeq`
- `detectProvider`
- `arrangePrintPages` / `arrangePrintPairs`
- `renderThermalSlipHtml`

---

## MVP 完成 vs TODO

### ✅ 已完成

- [x] 真實 BVSHOP checkbox selector 校正完成
- [x] 真實 `/order/query?order_ids=...` API 校正完成
- [x] 跨頁累積 `order_ids` 流程
- [x] popup 自動重新抓取完整訂單資料
- [x] 單頁模式 fallback（直接讀目前頁勾選）
- [x] 拖曳排序 + 即時流水號
- [x] 100×150mm 熱感出貨明細模板
- [x] `tracking_code` 警告提示

### 🔲 TODO

- [ ] 物流單產生（黑貓 / 順豐 / 綠界 / PayUni）
- [ ] Plan B：pdf-lib 合併物流單與出貨明細
- [ ] A4 / A5 / 80mm 版型
- [ ] 已列印標記 / 列印紀錄

---

## 備註

- `public/icons/` 與 build 後 `dist/icons/` 需為有效 PNG，避免 Chrome manifest 警告。
- 若 BVSHOP 後台改版，請優先重新確認 `src/bvshop/selectors.ts` 與 `src/bvshop/fetcher.ts`。
