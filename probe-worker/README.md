# probe-worker — PayUni 7-11 物流單可行性探測 Worker

> ⚠️ **此 Worker 僅供一次性可行性調查（Investigation Spike）**  
> 內含對第三方金流端點（`api.payuni.com.tw`）的請求。  
> 驗證完成後請立即執行 `wrangler delete` 移除，**切勿長期公開部署或用於正式環境**。  
> **不要**把任何真實的 EncryptInfo / HashInfo / token 存入此 repo。

---

## 1. 這個 Worker 是什麼？為什麼存在？

BVSHOP 出貨列印助手（Chrome MV3 擴充）的最終目標是「出貨明細 + 物流單交叉列印成同一份 PDF，靠流水號對應防錯」。

先前的調查（見 `docs/INVESTIGATION_SF_LABEL.md`）已證實：**瀏覽器內的 content script 因同源政策（CORS / opaqueredirect）無法跨網域取得物流單內容**。以 PayUni 7-11 交貨便為例：

```
content script 可同源呼叫：
  POST https://bvshop-manage.bvshop.tw/order/payuniCVS
  → 回傳含 form 的 HTML（form action 指向 api.payuni.com.tw）

但 content script 無法跟完後續跨網域跳轉：
  api.payuni.com.tw/api/logistics/print_label
  → epayment.7-11.com.tw/...（7-ELEVEN 交貨便服務單 HTML）
```

因此「合併成同一份 PDF」在純擴充下做不到。這個 Worker 的任務是**驗證：把那段 form HTML 交給 Cloudflare Worker，Worker 能不能跟完跳轉、拿到最終 7-11 服務單 HTML，並把 QR code / 條碼圖片抓成 base64 內嵌**。

### 探測要回答的三個關鍵問題

1. **Worker 能否跟完 PayUni→7-11 跳轉、拿到 7-11 服務單 HTML？**  
   （PayUni 可能驗 referer / origin / session，Worker 模擬不一定通過）
2. **7-11 服務單的圖片（QR code、條碼）能否被 Worker 抓取並轉 base64？**  
   （若圖片需登入態或防盜連，會卡住）
3. 綜合判斷：方案可行（🟢）或受阻（🔴）。

---

## 2. ⚠️ 安全警告（請務必遵守）

- **絕對不要**把任何密鑰、token、`EncryptInfo`、`HashInfo` 存入 git repo 或任何 commit 的檔案。
- `formHtml` 是使用者在**部署後**透過 HTTP POST 傳入的**執行期輸入**，不得寫死在程式裡。
- `.dev.vars` 已加入 `.gitignore`，請用它存放本機開發時需要的環境變數（目前此專案無需任何密鑰）。
- 探測完成後請立即執行 `wrangler delete` 移除 Worker（見第 7 節）。

---

## 3. 前置需求

- **Node.js 18+**
- **wrangler CLI**（建議全域安裝）：  
  ```bash
  npm install -g wrangler
  ```
- **Cloudflare 帳號**，並登入：  
  ```bash
  wrangler login
  ```

---

## 4. 本機開發

```bash
cd probe-worker
npm install
npm run dev
```

wrangler 會啟動本機開發伺服器（預設 `http://localhost:8787`）。

測試 `/health` 端點：

```bash
curl http://localhost:8787/health
# 期望回應：{"ok":true,"ts":1712345678901}
```

---

## 5. 部署到 Cloudflare

```bash
npm run deploy
```

部署成功後會得到類似：

```
https://bvprint-probe.<你的帳號>.workers.dev
```

記下這個 URL，接下來的探測會用到。

---

## 6. 如何執行探測

### 6.1 取得 formHtml

1. 登入 BVSHOP 後台（`bvshop-manage.bvshop.tw`）
2. 找一筆**已開好 PayUni 7-11 交貨便物流單**的訂單
3. 開啟 DevTools → **Network** 分頁
4. 點「檢視物流單」按鈕
5. 在 Network 裡找到 `payuniCVS` 那筆請求
6. 切到 **Response** 頁，複製 JSON 中的 `html` 欄位值（含 `<form ...>...</form>` 的完整字串）

> ⚠️ `html` 值有**時效性**（PayUni EncryptInfo 會過期），請拿到後立即使用。

### 6.2 準備請求 JSON 檔

為了避免 shell 跳脫問題，建議把請求 body 存成檔案：

```bash
cat > /tmp/probe-payload.json << 'EOF'
{
  "formHtml": "<form action='https://api.payuni.com.tw/api/logistics/print_label' method='post' id='upp'><input name='MerID' value='...' /><input name='EncryptInfo' value='REDACTED' /><input name='HashInfo' value='REDACTED' /><input name='Version' value='1.0' /></form><script>document.getElementById('upp').submit();</script>"
}
EOF
```

> ⚠️ 上方 `REDACTED` 是佔位字串，請替換成從 BVSHOP 後台複製的真實 `html` 值。**請勿把真實值存入 git**。

### 6.3 發送探測請求

```bash
curl -s -X POST https://bvprint-probe.<你的帳號>.workers.dev/probe/payuni \
  -H "Content-Type: application/json" \
  --data @/tmp/probe-payload.json \
  | jq .
```

---

## 7. 如何判讀結果

回應 JSON 中的 `verdict` 欄位：

### 🟢 可行
```
"verdict": "🟢 可行：Worker 取得 7-11 HTML 且圖片可內嵌，交叉合併 PDF 方案成立"
```
**代表**：Worker 成功跟完 PayUni→7-11 跳轉，取得 7-11 服務單 HTML，且 QR code / 條碼圖片可被 Worker 抓取並轉 base64 內嵌。  
**後續決策**：進入「完整擴充 + Worker 交叉合併出貨明細 + 物流單 PDF」的實作 PR。

---

### 🟡 部分可行
```
"verdict": "🟡 部分可行：HTML 取得但圖片無法內嵌，需進一步處理（QR/條碼來源限制）"
```
**代表**：Worker 拿到 7-11 服務單 HTML，但圖片（QR code / 條碼）因防盜連或 session 限制無法直接 fetch。  
**後續決策**：需進一步研究圖片來源；可能需要在 Worker 端額外模擬 session，或改為只內嵌 HTML 主體（不含圖片）。

---

### 🔴 受阻
```
"verdict": "🔴 受阻：見 steps 詳情，PayUni 可能擋 Worker 或需要額外驗證"
```
**代表**：Worker 無法取得 7-11 服務單（可能被 PayUni 以 session / IP / referer 驗證擋住）。  
**後續決策**：「交叉合併成同一份 PDF」方案在目前架構下不可行，退回「純擴充分組列印」（物流單在 7-11 分頁印、明細另印、靠流水號對應）。

---

詳細除錯資訊請參閱回應中的 `steps` 陣列，每一步都有 `ok`、`detail`、`error` 等欄位。

---

## 8. 用完清理（重要！）

探測完成後，請立即移除 Worker 避免長期暴露：

```bash
cd probe-worker
npx wrangler delete
```

確認刪除後，Cloudflare Dashboard 中的 `bvprint-probe` Worker 應消失。

---

## 9. 不要做

- ❌ 不要透過此 Worker 建立新物流單或觸發任何扣款行為；此 Worker 只跟隨 `type=print` 既有物流單的**檢視/列印**鏈路。
- ❌ 不要把任何真實的 `EncryptInfo` / `HashInfo` 存入 git repo。
- ❌ 不要把此 Worker 長期部署或用於正式環境。
- ❌ 不要修改 `extension/` 底下的任何程式（此探測與擴充完全獨立）。
