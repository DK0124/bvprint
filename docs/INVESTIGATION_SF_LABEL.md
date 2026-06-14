# 順豐物流單 PDF 抓取可行性調查報告

> **文件性質**：調查 / 探測（Investigation Spike）  
> **調查日期**：2026-06  
> **對應 probe 腳本**：`extension/src/bvshop/sfLabelProbe.ts`  
> **狀態**：⏳ 待真實環境驗證（請依第三節步驟執行後填入結果）

---

## 1. 問題定義

### 1.1 背景

BVSHOP 出貨列印助手（`DK0124/bvprint`）的最終目標是「**出貨明細與物流單穿插列印成同一份 PDF**」，以降低出貨配錯的機率。

穿插列印的目標列印序列如下：

```
#001  順豐物流單 (PDF)
#001  出貨明細   (擴充產生)
#002  出貨明細   ← 自訂物流，無物流單，跳過物流單頁
#003  順豐物流單 (PDF)
#003  出貨明細
```

### 1.2 為什麼「能否抓到順豐 PDF bytes」是關鍵決策點

要在同一份 PDF 裡做到「物流單 + 明細穿插」，必須：

1. **把順豐物流單 PDF 讀成 bytes**（`ArrayBuffer` / `Blob`）
2. 用 `pdf-lib` 將每張物流單 PDF 的頁面與自產明細 PDF 頁面依序合併
3. 疊上流水號後輸出單一 PDF

**順豐物流單的真實路徑：**

```
BVSHOP 同源頁（可加 credentials）：
  https://bvshop-manage.bv-shop.tw/order_multi_print_sf_logistics?ids=10541
    ↓ 302 轉址（跨網域）
  https://iuop.sf-express.com/iuop-product/api/print/printLabelByToken?token=<時效性 token>
    ↓
  最終回應：application/pdf
```

**核心問題**：content script 雖然在 BVSHOP 同源頁面內（可帶 `credentials`），但 302 跳到 `iuop.sf-express.com` 是**跨網域請求**。能否讀到跨網域回應 body，完全取決於順豐那個 endpoint 是否回傳 `Access-Control-Allow-Origin` CORS header。

### 1.3 決策後果

| 情境 | 策略 |
|------|------|
| ✅ 能拿到 PDF bytes | 逐筆穿插合併（同一份 PDF，最佳使用者體驗） |
| ❌ 被 CORS 擋住 | 分組列印（物流單另頁、明細另頁，靠流水號對應） |

---

## 2. 各策略技術分析

### 策略 A：`fetch(url, { credentials:'include', redirect:'follow' })`

**目標 URL**：`/order_multi_print_sf_logistics?ids=10541`（BVSHOP 同源相對路徑）

**預期行為**：

1. `fetch` 起點在 BVSHOP 同源 → 瀏覽器帶 cookie，第一段正常
2. BVSHOP 回 302 → `redirect:'follow'` 讓瀏覽器自動跟轉址到 `iuop.sf-express.com`
3. 此時 `fetch` 切換為跨網域 → 瀏覽器發出預檢（preflight）或直接 simple request
4. **關鍵**：若順豐 endpoint 沒有回 `Access-Control-Allow-Origin` → 瀏覽器阻擋讀取 body，`response.type` 變成 `'opaque'`；`blob()` 可以呼叫但 size=0（或部分實作會 throw）

**可能結果**：

| `response.type` | 意義 | 能讀 body？ |
|---|---|---|
| `'basic'` | 整個過程都在同源（未跳轉，或 BVSHOP 直接回 PDF） | ✅ 可讀 |
| `'cors'` | 跨網域且順豐給了正確 CORS header | ✅ 可讀 |
| `'opaque'` | 跨網域但 CORS 不通 | ❌ 不可讀 |
| `'opaqueredirect'` | 不應出現在 `redirect:follow` | N/A |

**限制**：若 `response.type === 'opaque'`，`blob.size` 會是 0（Chrome 行為），代表完全拿不到 PDF 內容。

---

### 策略 B：`fetch(url, { credentials:'include', redirect:'manual' })`

**目標**：攔截 302 前的回應，嘗試從 `Location` header 讀出帶 token 的順豐 URL。

**預期行為**：

- `redirect:'manual'` 告訴瀏覽器「不要自動跟轉址，把原始 302 回傳給我」
- 然而，根據 [Fetch 規範](https://fetch.spec.whatwg.org/#concept-filtered-response-opaque-redirect)，`redirect:manual` 且遇到重新導向時，瀏覽器回傳的是 **opaque redirect response**
  - `response.type === 'opaqueredirect'`
  - `response.status === 0`
  - **所有 header（含 `Location`）都是空的**，無法讀取
- 這是瀏覽器刻意的安全設計，防止腳本偷走跨網域轉址目標

**結論**：**幾乎可以確定拿不到 Location header**，此路線作為驗證，預期結果是 `opaqueredirect`。

---

### 策略 C：直接 `fetch` 順豐 URL（需先從 B 取得 Location）

**前提**：策略 B 能拿到 `Location` 中帶 token 的順豐 URL。

**預期行為**（假設策略 B 奇蹟成功拿到了 URL）：

- 對 `https://iuop.sf-express.com/.../printLabelByToken?token=...` 做 `fetch(sfUrl, { credentials:'omit' })`
- 跨網域 request → 瀏覽器查看順豐是否回傳 `Access-Control-Allow-Origin`
- 若沒有 CORS header → `response.type === 'opaque'`，無法讀 body

**現實預期**：策略 B 拿不到 Location，此路線**因 opaqueredirect 不可行**。

---

### 策略 D：隱藏 iframe / `chrome.tabs.create` 方案（分析性）

#### D1. 隱藏 iframe 載入順豐 PDF

```html
<iframe src="https://bvshop-manage.bv-shop.tw/order_multi_print_sf_logistics?ids=10541"
        style="display:none"></iframe>
```

- 瀏覽器確實會跟著 302 載入 PDF，但：
- **跨網域 iframe 安全限制**：父頁面完全無法存取 `iframe.contentDocument` 或 `iframe.contentWindow`（`SecurityError`）
- PDF 在 iframe 裡「看得到」，但程式化取不到 bytes
- **結論**：❌ 無法取得 PDF bytes

#### D2. `chrome.tabs.create` 開新分頁

```typescript
chrome.tabs.create({
  url: 'https://bvshop-manage.bv-shop.tw/order_multi_print_sf_logistics?ids=10541'
});
```

- 瀏覽器跟著 302 跳到順豐 PDF 分頁，等同使用者手動點「檢視物流單」
- ✅ 使用者可以在那個分頁手動列印 / 存 PDF
- ❌ 擴充無法從另一個分頁讀取跨網域 PDF 的 bytes
- **不需要** `host_permissions: ["https://iuop.sf-express.com/*"]`（瀏覽器自行跟轉址，不是擴充程式化 fetch）
- 適合「**分組列印**」方案，不適合「穿插合併」

---

## 3. 如何手動驗證

### 前置條件

- 已登入測試站：`https://bvshop-manage.bv-shop.tw`
- 訂單 10541 已在 BVSHOP 建立好順豐物流單
- Chrome 擴充已載入最新 build（`extension/dist/`）

### 執行步驟

1. **在測試站任意 `/order*` 頁面**（例如 `https://bvshop-manage.bv-shop.tw/order`）打開 DevTools → Console

2. **貼上以下程式碼執行**（或從已載入的 content script 觸發）：

   ```javascript
   // 方式一：從 content script 已暴露的 window 全域直接呼叫
   // （需擴充已 build 並注入 sfLabelProbe.ts）
   probeSfLabel(10541).then(r => {
     window.__sfProbeResult = r;
     console.log('📋 完整結果（可複製）:', JSON.stringify(r, null, 2));
   });
   ```

   ```javascript
   // 方式二：透過 chrome.runtime.sendMessage 觸發 content script 執行
   // （在擴充 popup 的 DevTools Console 或任何可存取 chrome.runtime 的地方）
   chrome.runtime.sendMessage(
     { type: 'PROBE_SF_LABEL', orderId: 10541 },
     (response) => {
       console.log('探測結果:', JSON.stringify(response?.data, null, 2));
     }
   );
   ```

3. **等待探測完成**（約 3–10 秒），Console 會印出：
   - 各策略的詳細結果（`strategyA`、`strategyB`、`strategyC`）
   - `strategyD`：分析說明文字
   - `verdict`：綜合判斷建議

4. **回報以下關鍵欄位**（把整個 JSON 物件複製回來最好）：

   | 欄位 | 說明 |
   |------|------|
   | `strategyA.responseType` | `'basic'` / `'cors'` / `'opaque'` |
   | `strategyA.ok` | HTTP 是否成功 |
   | `strategyA.blobSuccess` | 能否讀到 blob |
   | `strategyA.blobSize` | blob 大小（bytes） |
   | `strategyA.blobType` | MIME type（期望 `application/pdf`） |
   | `strategyA.finalUrl` | 最終落地 URL |
   | `strategyB.responseType` | 期望 `'opaqueredirect'` |
   | `verdict` | 系統給出的綜合建議 |

---

## 4. 後續路線決策樹

```
探測結果
  │
  ├─ strategyA.blobSuccess === true
  │   且 strategyA.blobType === 'application/pdf'
  │   且 strategyA.responseType === 'basic' 或 'cors'
  │                           │
  │                           ▼
  │            ✅ 可走「逐筆穿插合併同一份 PDF」
  │            ─────────────────────────────────
  │            實作步驟：
  │            1. content script fetch 同源 URL → PDF Blob → ArrayBuffer
  │            2. 明細 HTML 轉 PDF（選項：jsPDF + html2canvas，或 print-to-PDF）
  │            3. pdf-lib 合併：每筆 [物流單頁, 明細頁]（無物流單跳過物流單頁）
  │            4. 疊流水號 (#001/025) → 輸出單一 PDF Blob
  │            5. window.open(URL.createObjectURL(blob)) 讓使用者一次列印
  │
  │            需要的套件：
  │            - pdf-lib（合併、疊字）
  │            - jsPDF + html2canvas（明細 HTML → PDF）
  │              或 html2pdf.js（封裝版）
  │
  │            需要更新 manifest.json：
  │            - 目前 content script 已可同源 fetch，無需新增 host_permissions
  │            - 若要程式化 fetch iuop.sf-express.com，需加：
  │              "https://iuop.sf-express.com/*"
  │
  │
  └─ strategyA.responseType === 'opaque'
      或 strategyA.blobSuccess === false
      或 strategyA.error 有值
                          │
                          ▼
          ❌ CORS 擋住，改走「分組列印」
          ──────────────────────────────
          實作步驟：
          1. 使用者先按「📦 開啟順豐物流單」
             → background chrome.tabs.create({
                 url: 'https://bvshop-manage.bv-shop.tw/
                       order_multi_print_sf_logistics?ids=ID1,ID2,...'
               })
             → BVSHOP 302 到順豐 PDF 分頁，使用者在那裡手動列印
          2. 使用者再按「🖨 列印出貨明細」
             → 現有 window.print() 流程，明細含流水號
          
          防錯機制（靠流水號）：
          - 物流單依相同訂單排序順序，BVSHOP PDF 頁碼 = 流水號順序
          - 明細印有 #001/025 等流水號
          - 使用者對齊流水號一一配對，錯誤率極低
          
          優點：
          - 100% 可行，不依賴任何跨網域 CORS
          - 不需引入 pdf-lib / jsPDF 等新套件
          - 不需更新 manifest.json
```

---

## 5. Manifest 權限影響分析

### 現況

`manifest.json` 的 `host_permissions` 目前包含 BVSHOP 網域（`bvshop.tw` 和/或 `bv-shop.tw`）。

### 各方案所需權限

| 操作 | 是否需要 `iuop.sf-express.com` 權限 |
|------|--------------------------------------|
| `chrome.tabs.create` 開 BVSHOP 同源頁，讓瀏覽器自行跟 302 到順豐 | ❌ 不需要（瀏覽器行為，非擴充程式化 fetch） |
| content script `fetch('https://iuop.sf-express.com/...')` | ✅ 需要（跨網域 fetch 需要 `host_permissions`） |
| content script `fetch('/order_multi_print_sf_logistics?...')` | ❌ 不需要（同源，已有 BVSHOP 權限） |

### 建議

- **分組列印方案**：不需修改 manifest，`chrome.tabs.create` 開 BVSHOP 頁即可
- **穿插合併方案（若策略 A 成功）**：`fetch` 起點是 BVSHOP 同源，瀏覽器自動跟到順豐；若需要直接 fetch 順豐（例如重試），才需加：
  ```json
  "host_permissions": [
    "https://bvshop-manage.bvshop.tw/*",
    "https://bvshop-manage.bv-shop.tw/*",
    "https://iuop.sf-express.com/*"
  ]
  ```
- 注意：加入 `host_permissions` 不等於 CORS 會通過；CORS 是由**伺服器**（順豐）決定，不是擴充程式能控制的

### 雙網域（測試站 / 正式站）

| 環境 | 網域 |
|------|------|
| 測試站 | `bvshop-manage.bv-shop.tw`（有連字號） |
| 正式站 | `bvshop-manage.bvshop.tw`（無連字號） |

`manifest.json` 的 `host_permissions` 與 `content_scripts.matches` 應同時包含兩個網域。

---

## 6. 探測結果填寫區（等待真實環境執行）

> 請依第三節步驟在測試站執行 `probeSfLabel(10541)` 後，將結果填入此處。

```
執行時間：_______________
執行環境：bvshop-manage.bv-shop.tw（測試站）
訂單 ID：10541

strategyA.responseType：_______________
strategyA.ok：_______________
strategyA.blobSuccess：_______________
strategyA.blobSize：_______________
strategyA.blobType：_______________
strategyA.finalUrl：_______________
strategyA.note：_______________

strategyB.responseType：_______________
strategyB.note：_______________

strategyC.note：_______________

verdict：_______________

→ 決定採用的後續路線：
  [ ] 逐筆穿插合併（策略 A 成功）
  [ ] 分組列印（CORS 擋住）
```

---

## 附錄：probe 腳本快速參考

```typescript
// 在 BVSHOP /order* 頁面的 DevTools Console 執行：
probeSfLabel(10541).then(r => console.log(JSON.stringify(r, null, 2)));

// 或透過 content script 訊息觸發（在擴充 popup DevTools）：
chrome.runtime.sendMessage(
  { type: 'PROBE_SF_LABEL', orderId: 10541 },
  (r) => console.log(r?.data)
);
```

腳本位置：`extension/src/bvshop/sfLabelProbe.ts`  
⚠️ 此腳本為**調查專用**，不屬於正式列印流程，驗證完成後可移除。
