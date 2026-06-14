# BVSHOP 出貨列印助手 (MVP)

本專案為 BVSHOP 出貨列印助手 MVP，採用 npm workspaces monorepo。

## 架構

- `apps/web`: React + Vite + TypeScript 管理介面
- `apps/server`: Node.js + Express + TypeScript API 代理
- `packages/bvshop-api`: BVSHOP API client 與型別
- `packages/print-core`: 流水號、排序、PDF 處理核心
- `packages/templates`: 100x150 熱感出貨明細模板

## 安裝與啟動

1. 安裝依賴

   ```bash
   npm install
   ```

2. 設定環境變數

   ```bash
   cp .env.example .env
   ```

   填入 `BVSHOP_API_TOKEN`。

3. 安裝 Playwright 瀏覽器

   ```bash
   npx playwright install
   ```

4. 啟動

   ```bash
   npm run dev
   ```

   - web: `http://localhost:5173`
   - server: `http://localhost:3001`

## 安全注意事項

- BVSHOP Token 僅從 server 端 `.env` 讀取。
- 前端只呼叫 `/api/*`，不直接呼叫 BVSHOP。
- `.env` 已加入 `.gitignore`。
- PDF 產生流程僅在記憶體中處理，不持久化顧客個資。

## 目前 MVP 完成度

- 已完成：訂單查詢代理、選單+拖曳排序、流水號預覽、建立列印任務、黑貓 PDF 處理、熱感出貨明細生成、基本測試。
- Stub/TODO：綠界/PayUni/順豐自動轉 PDF 合併、第二階段物流與付款對照表設定頁、正式版 token 加密儲存。
