# BVSHOP 出貨列印助手 — Copilot 開發規格

## 1. 專案目標

建立一套給 BVSHOP 商家使用的「出貨列印助手」，功能類似 Shopkits Shipment Print：

- 可依照訂單順序列印物流單與出貨明細。
- 支援每批列印自動產生流水編號，例如 `001 / 025`。
- 物流單與出貨明細都要顯示同一組流水編號，避免印出後搞混。
- BVSHOP 目前出貨明細只有 A4，本專案要自行產生熱感格式出貨明細。
- 預設紙張尺寸：`100mm x 150mm`，可擴充 `A4`、`A5`、`80mm` 捲紙。
- MVP 先做「API 版」，之後可做 Chrome Extension 版讀取 BVSHOP 後台勾選訂單。

---

## 2. 安全原則

### 2.1 不要做的事

- 不要把 BVSHOP API Token 寫死在前端程式碼。
- 不要把 BVSHOP API Token commit 到 GitHub。
- 不要把物流商金鑰、店家密鑰、Bearer Token 放在 extension 原始碼中。
- 不要長期保存顧客姓名、電話、地址、商品明細。

### 2.2 MVP 開發模式

MVP 可以先做單店內部測試版：

- 使用 `.env` 儲存 BVSHOP API Token。
- `.env` 必須加入 `.gitignore`。
- 所有 BVSHOP API 呼叫由 Node.js server 代理，不從 React 前端直接打 BVSHOP API。
- 前端只呼叫自己的 server API。

### 2.3 正式商業版

正式版應改為：

- 每個店家登入你的系統。
- 店家在你的後台輸入 BVSHOP API Token。
- Token 在資料庫中加密保存。
- 前端永遠不回傳 BVSHOP Token。
- PDF 產生過程只暫存記憶體，不永久保存顧客資料。

---

## 3. 建議技術架構

### 3.1 Repo 結構

```txt
bvshop-print-assistant/
  apps/
    web/                    # React/Vite 前端管理介面
    server/                 # Node.js / Express API server
  packages/
    bvshop-api/             # BVSHOP API client
    print-core/             # 列印任務、流水號、PDF 合併邏輯
    templates/              # 出貨明細 HTML / CSS 模板
  docs/
    API_USAGE.md
    SECURITY.md
    MVP_CHECKLIST.md
  .env.example
  .gitignore
  README.md
```

### 3.2 建議套件

Server:

- `express`
- `zod`
- `axios`
- `pdf-lib`
- `playwright` 或 `puppeteer`：將 HTML 熱感出貨明細轉 PDF。

Frontend:

- `vite`
- `react`
- `typescript`
- `react-hook-form`
- `zod`

共用：

- `typescript`
- `eslint`
- `prettier`

---

## 4. API 分類：哪些有用到

### 4.1 MVP 必用

#### A. 取得訂單列表

```http
GET /orders
```

用途：

- 拉取訂單清單。
- 讓使用者選擇要列印哪些訂單。
- 可用 `withDetail=1` 直接包含詳細資料，減少逐筆查詢。
- 可用 `limit=100` 一次取得最多 100 筆。

可用參數：

```txt
orderStatus      訂單狀態，多狀態用逗號隔開
paymentStatus    付款狀態，多狀態用逗號隔開
logisticStatus   出貨狀態，多狀態用逗號隔開
customerId       顧客 ID
dealerCode       經銷代碼
dateType         created / paid / cancel
startAt          YYYY-MM-DD
endAt            YYYY-MM-DD
limit            最多 100
page             頁數
withDetail       0 / 1，建議 MVP 用 1
```

MVP 建議查詢：

```http
GET /orders?limit=100&page=1&withDetail=1&logisticStatus=1,2
```

注意：

- 使用者若在前端拖曳排序，流水號需依照前端最終排序重新產生。
- 如果 `withDetail=1` 回傳資料不完整，改為 `/orders/{id}` 逐筆補資料。

---

#### B. 取得訂單資料

```http
GET /orders/{id}
```

用途：

- 取得單筆完整訂單資料。
- 產生熱感出貨明細。
- 物流單與訂單配對。
- 補足 `/orders?withDetail=1` 不完整的欄位。

需要用到的欄位：

```ts
interface BvOrderDetail {
  id: number;
  uid: string;                    // 訂單編號
  createdAt: string;
  paidAt?: string | null;
  shipmentAt?: string | null;
  orderStatus: number;
  paymentStatus: number;
  logisticStatus: number;
  paymentMethod: string;
  logisticMethod: string;
  logisticTraceCode?: string | null;
  discountPrice: number;
  shippingFee: number;
  fee: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  customerId: number;
  orderItems: BvOrderItem[];
  customizeItems: BvOrderItem[];
  remark?: string | null;
  cvs?: {
    storeName: string;
    storeNum: string | number;
    storeBrand: 'unifart' | 'fami' | 'okmart' | 'hilife';
  } | null;
  invoice?: BvInvoice | null;
}
```

熱感出貨明細要顯示：

- 流水編號：`001 / 025`
- 訂單編號：`uid`
- 訂單日期：`createdAt`
- 收件人：`receiverName`
- 電話：`receiverPhone`
- 地址：`receiverAddress`，宅配才顯示
- 超商門市：`cvs.storeName`、`cvs.storeNum`，超商才顯示
- 物流方式：`logisticMethod`
- 付款方式：`paymentMethod`
- 付款狀態：`paymentStatus`
- 商品明細：`orderItems + customizeItems`
- 訂單備註：`remark`
- 總金額：`totalPrice`

---

#### C. 產生物流單 — 綠界

```http
POST /order-logistic/ecpay
Content-Type: multipart/form-data
```

Request:

```txt
id           訂單 ID
senderName   寄件人姓名
senderPhone  寄件人電話
```

Response:

```json
{
  "html": "綠界物流單 html form"
}
```

用途：

- 產生綠界物流單。
- 回傳的是 HTML form，不是直接 PDF。
- 需要在 server 或瀏覽器環境處理該 form，可能會導向第三方列印頁。

實作注意：

- 不要盲目重複呼叫，避免重複產生物流單。
- 呼叫前先檢查訂單是否已有 `logisticTraceCode`。
- MVP 可先把 HTML 存為中間結果，開啟預覽頁確認。

---

#### D. 產生物流單 — 統一金流 PayUni

```http
POST /order-logistic/payuni
Content-Type: multipart/form-data
```

Request:

```txt
id           訂單 ID
senderName   寄件人姓名
senderPhone  寄件人電話
```

Response:

```json
{
  "html": "統一金流物流單 html form"
}
```

用途與注意事項同綠界。

---

#### E. 產生物流單 — 黑貓

```http
POST /order-logistic/tcat
Content-Type: multipart/form-data
```

Request:

```txt
id           訂單 ID
senderName   寄件人姓名
senderPhone  寄件人電話
```

Response:

```json
{
  "pdf": "黑貓物流單 raw pdf"
}
```

用途：

- 產生黑貓物流單。
- 這是 MVP 最容易做完整 PDF 合併的物流類型。
- 若 `pdf` 是 base64，需 decode 成 bytes。
- 若 `pdf` 是 raw binary string，需確認 BVSHOP 實際回傳格式。

---

#### F. 產生物流單 — 順豐

```http
POST /order-logistic/sf
Content-Type: multipart/form-data
```

Request:

```txt
id           訂單 ID
senderName   寄件人姓名
senderPhone  寄件人電話
```

Response:

```json
{
  "printUrl": "順豐物流單 url"
}
```

用途：

- 產生順豐物流單。
- 回傳列印 URL。
- 需要 server 端抓取或瀏覽器開啟列印頁。

---

### 4.2 第二階段有用

#### A. 取得送貨方式

```http
GET /logistics
```

用途：

- 取得店家的送貨方式 ID 與名稱。
- 建立物流方式對照表。
- 判斷某筆訂單應走綠界、PayUni、黑貓、順豐或其他。
- 用於設定頁，讓店家手動把 `logisticMethod` 對應到物流單 API provider。

MVP 可以先不用，先從 `order.logisticMethod` 字串判斷。

---

#### B. 取得付款方式

```http
GET /payments
```

用途：

- 付款方式對照表。
- 顯示在熱感出貨明細上。
- 若訂單資料已有 `paymentMethod` 字串，MVP 可不使用。

---

### 4.3 暫時不要用

#### A. 新增訂單

```http
POST /orders
```

結論：本專案不需要。

原因：

- 本專案是「出貨列印助手」，不是建立訂單工具。
- 這支 API 適合另一個專案：Excel / 嘖嘖 / 外部訂單匯入 BVSHOP。

---

#### B. 更新訂單

```http
PUT /orders/{id}
```

結論：MVP 不要自動使用。

可更新欄位：

```txt
orderStatus
paymentStatus
logisticStatus
traceCode
editItems
```

原因：

- 列印物流單不應自動改訂單狀態。
- 自動改 `logisticStatus` 可能造成店家誤判已出貨。
- `traceCode` 應由物流單產生流程或 BVSHOP 正式流程寫入，除非確認 API 需求。

第二階段可加入手動選項：

```txt
[ ] 列印完成後，將訂單標記為處理中
[ ] 列印完成後，將訂單標記為已出貨
```

但預設必須關閉。

---

## 5. 核心資料模型

### 5.1 列印任務

```ts
export interface PrintJob {
  id: string;
  createdAt: string;
  total: number;
  senderName: string;
  senderPhone: string;
  paperSize: 'THERMAL_100X150' | 'A4' | 'A5' | 'ROLL_80MM';
  mode: 'PAIR' | 'LABELS_FIRST' | 'SLIPS_FIRST';
  orders: PrintOrder[];
}
```

### 5.2 列印訂單

```ts
export interface PrintOrder {
  orderId: number;
  orderUid: string;
  sortIndex: number;
  printSeq: number;
  printSeqText: string; // 例如 001 / 025
  order: BvOrderDetail;
  provider: LogisticProvider;
}

export type LogisticProvider =
  | 'ecpay'
  | 'payuni'
  | 'tcat'
  | 'sf'
  | 'unknown';
```

### 5.3 物流單結果

```ts
export type ShipmentLabelResult =
  | {
      provider: 'tcat';
      type: 'rawPdf';
      pdfBytes: Uint8Array;
    }
  | {
      provider: 'ecpay' | 'payuni';
      type: 'htmlForm';
      html: string;
    }
  | {
      provider: 'sf';
      type: 'printUrl';
      printUrl: string;
    };
```

---

## 6. 流水編號規格

### 6.1 格式

```txt
001 / 025
002 / 025
003 / 025
```

### 6.2 產生規則

```ts
function makePrintSeq(index: number, total: number): string {
  const width = Math.max(3, String(total).length);
  return `${String(index + 1).padStart(width, '0')} / ${String(total).padStart(width, '0')}`;
}
```

### 6.3 顯示位置

每一筆訂單要在以下地方顯示同一個流水編號：

1. 前端訂單列表。
2. 物流單 PDF 疊字區。
3. 熱感出貨明細最上方。
4. PDF 檔名或列印任務紀錄。

物流單上疊字建議只印：

```txt
#001/025
```

不要蓋到條碼、QR Code、收件資料。

---

## 7. 列印排序規格

### 7.1 預設模式：成對排序

```txt
#001 物流單
#001 出貨明細
#002 物流單
#002 出貨明細
#003 物流單
#003 出貨明細
```

此模式最不容易配錯，設為預設。

### 7.2 可選模式：物流單優先

```txt
#001 物流單
#002 物流單
#003 物流單
#001 出貨明細
#002 出貨明細
#003 出貨明細
```

### 7.3 可選模式：出貨明細優先

```txt
#001 出貨明細
#002 出貨明細
#003 出貨明細
#001 物流單
#002 物流單
#003 物流單
```

---

## 8. 熱感出貨明細模板

### 8.1 100x150mm 版面

```html
<section class="slip slip-100x150">
  <header class="slip-header">
    <div class="seq">#001 / 025</div>
    <div class="title">出貨明細</div>
    <div class="order-no">訂單：2407081253FRDURE</div>
  </header>

  <section class="receiver">
    <div>收件人：王小明</div>
    <div>電話：0912***789</div>
    <div class="address">地址：台中市西區...</div>
    <div class="cvs">門市：7-11 公益門市 / 123456</div>
  </section>

  <section class="meta">
    <div>物流：7-ELEVEN 店到店</div>
    <div>付款：信用卡 / 已付款</div>
  </section>

  <section class="items">
    <div class="item">
      <div class="name">商品名稱</div>
      <div class="qty">x 2</div>
    </div>
  </section>

  <section class="remark">
    備註：請盡快出貨
  </section>

  <footer>
    <div>總額：$1,280</div>
  </footer>
</section>
```

### 8.2 CSS

```css
@page {
  size: 100mm 150mm;
  margin: 3mm;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  font-size: 10px;
}

.slip {
  box-sizing: border-box;
  width: 100mm;
  min-height: 150mm;
  padding: 3mm;
}

.seq {
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  border: 2px solid #000;
  padding: 2mm 0;
  margin-bottom: 2mm;
}

.title {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.order-no {
  font-size: 11px;
  text-align: center;
  margin-bottom: 2mm;
}

.receiver,
.meta,
.items,
.remark,
footer {
  border-top: 1px solid #000;
  padding-top: 2mm;
  margin-top: 2mm;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 2mm;
  margin-bottom: 1.5mm;
}

.item .name {
  flex: 1;
  word-break: break-word;
}

.item .qty {
  min-width: 14mm;
  text-align: right;
  font-weight: 700;
}
```

---

## 9. Server API 設計

### 9.1 取得訂單

```http
GET /api/orders?startAt=2026-06-01&endAt=2026-06-14&logisticStatus=1,2&page=1&limit=100
```

Server 代理到：

```http
GET {BVSHOP_API_BASE}/orders?withDetail=1&...
```

---

### 9.2 建立列印任務

```http
POST /api/print-jobs
```

Request:

```json
{
  "orderIds": [660, 661, 662],
  "senderName": "店家名稱",
  "senderPhone": "0912345678",
  "paperSize": "THERMAL_100X150",
  "mode": "PAIR",
  "providerMap": {
    "黑貓": "tcat",
    "順豐": "sf",
    "綠界": "ecpay",
    "統一金流": "payuni"
  }
}
```

Response:

```json
{
  "jobId": "pj_20260614_0001",
  "total": 3,
  "orders": [
    {
      "orderId": 660,
      "orderUid": "2407081253FRDURE",
      "printSeqText": "001 / 003",
      "provider": "ecpay"
    }
  ]
}
```

---

### 9.3 產生 PDF

```http
POST /api/print-jobs/{jobId}/pdf
```

Response:

```txt
application/pdf
```

處理流程：

1. 依照 job 訂單順序載入訂單資料。
2. 產生每筆的物流單。
3. 產生每筆的熱感出貨明細 PDF。
4. 在物流單 PDF 疊上流水號。
5. 依模式合併 PDF。
6. 回傳合併後 PDF。

---

## 10. BVSHOP API Client 規格

```ts
export class BvshopApiClient {
  constructor(options: {
    baseUrl: string;
    token: string;
  });

  listOrders(params: ListOrdersParams): Promise<Paginated<BvOrder>>;
  getOrder(id: number | string): Promise<BvOrderDetail>;
  listLogistics(): Promise<Array<{ id: number; name: string }>>;
  listPayments(): Promise<Array<{ id: number; name: string }>>;

  createEcpayLabel(input: CreateLabelInput): Promise<{ html: string }>;
  createPayuniLabel(input: CreateLabelInput): Promise<{ html: string }>;
  createTcatLabel(input: CreateLabelInput): Promise<{ pdf: string }>;
  createSfLabel(input: CreateLabelInput): Promise<{ printUrl: string }>;
}

export interface CreateLabelInput {
  id: number;
  senderName: string;
  senderPhone: string;
}
```

---

## 11. 物流 Provider 判斷

MVP 先用字串判斷：

```ts
export function detectProvider(logisticMethod: string): LogisticProvider {
  const text = logisticMethod.toLowerCase();

  if (text.includes('黑貓') || text.includes('tcat')) return 'tcat';
  if (text.includes('順豐') || text.includes('sf')) return 'sf';
  if (text.includes('統一金流') || text.includes('payuni')) return 'payuni';
  if (text.includes('綠界') || text.includes('ecpay')) return 'ecpay';

  return 'unknown';
}
```

第二階段改成設定頁：

```txt
送貨方式名稱                  Provider
---------------------------------------
綠界 7-ELEVEN 店到店           ecpay
綠界 全家店到店                ecpay
統一金流 7-ELEVEN              payuni
黑貓宅急便                     tcat
順豐宅配                       sf
```

---

## 12. PDF 合併邏輯

### 12.1 成對排序

```ts
for (const order of job.orders) {
  const labelPdf = await generateShipmentLabelPdf(order);
  const slipPdf = await generateThermalSlipPdf(order);

  const stampedLabelPdf = await stampSequenceOnPdf(labelPdf, order.printSeqText);

  merged.add(stampedLabelPdf);
  merged.add(slipPdf);
}
```

### 12.2 疊流水號

```ts
async function stampSequenceOnPdf(pdfBytes: Uint8Array, seq: string): Promise<Uint8Array> {
  // 使用 pdf-lib 將 #001/025 疊在物流單右上角或左上角。
  // 預設位置需可在設定中調整，避免蓋到條碼。
}
```

---

## 13. 重要風險與待測項目

### 13.1 物流單 API 可能會「產生新物流單」

這幾支 API 名稱是「產生物流單」，不是「取得既有物流單」。因此：

- 不能在使用者預覽時就自動大量呼叫。
- 按下「正式產生物流單」前要二次確認。
- 如果訂單已有 `logisticTraceCode`，要提示使用者。

建議提示：

```txt
此操作可能會向物流商建立正式物流單。若重複產生可能造成後台資料混亂。是否繼續？
```

### 13.2 HTML form 型物流單不一定能直接合併 PDF

綠界與 PayUni 回傳 `html` form：

- 需要測試 form 是否會自動 submit 到第三方物流列印頁。
- 若第三方頁面有防 iframe、防跨域或需要使用者互動，server 不一定能轉 PDF。
- 第一版可以先開新視窗列印，第二版再做自動 PDF 合併。

### 13.3 中文 PDF 字型

若用 `pdf-lib` 直接畫中文，需另外處理中文字型。

建議：

- 熱感出貨明細用 HTML + Playwright 轉 PDF。
- 物流單疊字只疊英文數字，例如 `#001/025`，避免中文字型問題。

---

## 14. MVP 開發步驟

### Step 1 — 建立 repo 與環境

- 建立 monorepo。
- 加入 TypeScript。
- 建立 `.env.example`。
- `.env` 加入 `.gitignore`。

### Step 2 — 建立 BVSHOP API client

完成：

- `listOrders`
- `getOrder`
- `createTcatLabel`
- `createEcpayLabel`
- `createPayuniLabel`
- `createSfLabel`

### Step 3 — 建立前端訂單列表

功能：

- 日期篩選。
- 訂單狀態篩選。
- 出貨狀態篩選。
- 顯示訂單 ID、訂單編號、收件人、物流方式、付款狀態、出貨狀態。
- 可勾選多筆。
- 可拖曳排序。
- 顯示流水號預覽。

### Step 4 — 熱感出貨明細

功能：

- 產生單筆 100x150mm HTML。
- 產生多筆 PDF。
- 流水號大字置頂。

### Step 5 — 黑貓物流單 PDF 合併

先完成最容易的黑貓：

- 呼叫 `/order-logistic/tcat`。
- 解析 `pdf`。
- 疊流水號。
- 與熱感出貨明細成對合併。

### Step 6 — 綠界 / PayUni / 順豐

逐一測試：

- `ecpay` HTML form。
- `payuni` HTML form。
- `sf` printUrl。

### Step 7 — 防呆

- 已有物流追蹤碼提示。
- 未知物流方式提示。
- API 401 顯示 Token 錯誤。
- API 422 顯示欄位錯誤。
- PDF 產生失敗可下載錯誤報告。

---

## 15. Copilot 任務提示詞

可直接貼給 GitHub Copilot / Copilot Chat：

```txt
請依照本 repo 的 BVSHOP 出貨列印助手規格開發 MVP。

目標：
建立 TypeScript monorepo，包含 React/Vite 前端與 Node/Express server。
前端可查詢 BVSHOP 訂單、勾選訂單、拖曳排序、顯示流水編號。
Server 代理 BVSHOP API，不要讓前端直接保存或呼叫 BVSHOP Token。

MVP 必做：
1. 實作 BvshopApiClient：listOrders、getOrder、createTcatLabel、createEcpayLabel、createPayuniLabel、createSfLabel。
2. 實作訂單列表頁：日期、出貨狀態、付款狀態篩選，支援多選與排序。
3. 實作流水號：001 / 025，排序改變時即時重算。
4. 實作 100mm x 150mm 熱感出貨明細 HTML 模板。
5. 使用 Playwright 將熱感出貨明細 HTML 轉 PDF。
6. 先支援黑貓 tcat raw pdf：取得物流單、用 pdf-lib 疊上 #001/025、與出貨明細成對合併。
7. 綠界、PayUni、順豐先建立 adapter 介面與初步處理，若無法轉 PDF，先回傳 pending/manual print 狀態。
8. 所有 API Token 只放 server .env，不可放前端。
9. 提供 .env.example、README、錯誤處理與基本測試。

請先建立資料夾結構、型別定義、API client、server routes，再做前端 UI。
```

---

## 16. `.env.example`

```env
BVSHOP_API_BASE=https://bvshop-manage.bvshop.tw/api/v2
BVSHOP_API_TOKEN=replace_with_your_token
PORT=3001
```

---

## 17. `.gitignore`

```gitignore
node_modules
.env
.env.local
dist
build
coverage
.playwright
.DS_Store
```

---

## 18. MVP 驗收標準

完成後應能做到：

1. 從 BVSHOP API 查詢訂單。
2. 選取 3 筆以上訂單。
3. 手動調整順序。
4. 系統顯示 `001 / 003`、`002 / 003`、`003 / 003`。
5. 產生熱感出貨明細 PDF。
6. 黑貓物流單可疊流水號。
7. 產生合併 PDF：

```txt
#001 物流單
#001 出貨明細
#002 物流單
#002 出貨明細
#003 物流單
#003 出貨明細
```

8. 不會把 BVSHOP Token 暴露到前端 bundle。
9. 不會把 `.env` commit 到 GitHub。

---

## 19. 後續擴充

- Chrome Extension：在 BVSHOP 後台訂單列表直接讀取勾選訂單。
- 店家登入與授權碼。
- 多店家 Token 加密管理。
- 列印紀錄。
- 已列印標記。
- 設定物流單流水號疊字位置。
- 支援 A4、A5、80mm 捲紙。
- 支援批量下載與重新列印。
