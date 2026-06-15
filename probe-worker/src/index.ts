/**
 * ⚠️ 此 Worker 僅供一次性可行性調查，內含對第三方金流端點（api.payuni.com.tw）的請求；
 * 驗證完成後請以 `wrangler delete` 移除，切勿長期公開部署或用於正式環境。
 *
 * 目的：驗證「PayUni 7-11 交貨便物流單能否由 Cloudflare Worker 跨網域取得並內嵌圖片」，
 * 作為「出貨明細 + 物流單交叉合併 PDF」方案的前置可行性探測。
 *
 * 路由：
 *   GET  /health        → 確認部署狀態
 *   POST /probe/payuni  → 探測主端點（接受含 formHtml 的 JSON body）
 *   *                   → 404
 */

// ────────────────────────────────────────────────────────────────────
// 型別定義
// ────────────────────────────────────────────────────────────────────

interface ProbeRequest {
  formHtml: string;
}

interface ImageProbeResult {
  src: string;
  absoluteUrl: string;
  status: number | null;
  contentType: string | null;
  bytes: number | null;
  base64ok: boolean;
  /** 第一張成功圖片的 base64 前 100 字（僅作佐證樣本，不回傳完整內容） */
  base64Prefix?: string;
  error?: string;
}

interface ProbeStep {
  step: string;
  ok: boolean;
  detail?: unknown;
  error?: string;
}

interface ProbeResult {
  verdict: string;
  steps: ProbeStep[];
  parsedForm?: {
    action: string;
    fieldNames: string[];
    /** 敏感欄位只回傳前 8 碼加「…」，避免 EncryptInfo/HashInfo 洩漏 */
    fieldPreview: Record<string, string>;
  };
  fetchResult?: {
    status: number;
    finalUrl: string;
    redirected: boolean;
    contentType: string | null;
    htmlLength: number;
    htmlSnippet: string;
    heuristics: {
      has交貨便: boolean;
      has7ELEVEN: boolean;
      has統一超商: boolean;
      hasC2C: boolean;
      has交貨便服務代碼: boolean;
      has物流條碼: boolean;
      looks711: boolean;
    };
  };
  images?: ImageProbeResult[];
}

// ────────────────────────────────────────────────────────────────────
// CORS helpers
// ────────────────────────────────────────────────────────────────────

/** 模擬瀏覽器 UA，盡量讓 PayUni / 7-11 伺服器接受請求 */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// ────────────────────────────────────────────────────────────────────
// 工具函式
// ────────────────────────────────────────────────────────────────────

/** 將 EncryptInfo / HashInfo 等敏感字串遮罩，只顯示前 8 碼 */
function maskSensitive(value: string): string {
  if (value.length <= 8) return "***";
  return value.slice(0, 8) + "…";
}

/**
 * 從 formHtml 解析出 action URL 與所有 hidden input 欄位。
 * 注意：PayUni 回傳的字串常含跳脫斜線 `\/`，需先還原成 `/`。
 */
function parseForm(rawHtml: string): {
  action: string;
  fields: Record<string, string>;
} | null {
  // 還原跳脫斜線
  const html = rawHtml.replace(/\\\//g, "/");

  // 解析 form action（單引號或雙引號）
  const actionMatch = html.match(/<form[^>]+action=['"]([^'"]+)['"]/i);
  if (!actionMatch) return null;
  const action = actionMatch[1];

  // 解析所有 input name/value（單引號或雙引號混用）
  const fields: Record<string, string> = {};
  const inputRe = /<input[^>]+>/gi;
  let m: RegExpExecArray | null;
  while ((m = inputRe.exec(html)) !== null) {
    const tag = m[0];
    const nameMatch = tag.match(/name=['"]([^'"]+)['"]/i);
    const valueMatch = tag.match(/value=['"]([^'"]*)['"]/i);
    if (nameMatch) {
      fields[nameMatch[1]] = valueMatch ? valueMatch[1] : "";
    }
  }

  return { action, fields };
}

/** 從 HTML 字串取出最多 maxCount 個 img src（相對或絕對） */
function extractImgSrcs(html: string, maxCount: number): string[] {
  const srcs: string[] = [];
  const re = /<img[^>]+src=['"]([^'"]+)['"]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && srcs.length < maxCount) {
    srcs.push(m[1]);
  }
  return srcs;
}

/** 將相對 URL 轉換成絕對 URL（以 base 為基準） */
function toAbsoluteUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

/** 將 ArrayBuffer 轉為 base64 字串 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ────────────────────────────────────────────────────────────────────
// 主要邏輯
// ────────────────────────────────────────────────────────────────────

async function handleProbePayuni(request: Request): Promise<Response> {
  const result: ProbeResult = {
    verdict: "🔴 受阻：見 steps 詳情，PayUni 可能擋 Worker 或需要額外驗證",
    steps: [],
  };

  // ── 步驟 1：解析請求 body ──────────────────────────────────────────
  let formHtml: string;
  try {
    const body = await request.json() as ProbeRequest;
    if (!body.formHtml || typeof body.formHtml !== "string") {
      return corsJson({ error: "缺少 formHtml 欄位" }, 400);
    }
    formHtml = body.formHtml;
    result.steps.push({ step: "1. 讀取請求 body", ok: true, detail: { formHtmlLength: formHtml.length } });
  } catch (e) {
    result.steps.push({ step: "1. 讀取請求 body", ok: false, error: String(e) });
    return corsJson(result);
  }

  // ── 步驟 2：解析 form HTML ────────────────────────────────────────
  let parsedForm: ReturnType<typeof parseForm>;
  try {
    parsedForm = parseForm(formHtml);
    if (!parsedForm) {
      result.steps.push({ step: "2. 解析 form HTML", ok: false, error: "找不到 <form action=...>，HTML 格式不符預期" });
      return corsJson(result);
    }

    const SENSITIVE_KEYS = ["EncryptInfo", "HashInfo"];
    const fieldNames = Object.keys(parsedForm.fields);
    const fieldPreview: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsedForm.fields)) {
      // 敏感欄位只回遮罩值，不回原值，避免憑證洩漏
      fieldPreview[k] = SENSITIVE_KEYS.includes(k) ? maskSensitive(v) : v;
    }

    result.parsedForm = { action: parsedForm.action, fieldNames, fieldPreview };
    result.steps.push({
      step: "2. 解析 form HTML",
      ok: true,
      detail: { action: parsedForm.action, fieldCount: fieldNames.length, fieldNames },
    });
  } catch (e) {
    result.steps.push({ step: "2. 解析 form HTML", ok: false, error: String(e) });
    return corsJson(result);
  }

  // ── 步驟 3：POST 到 PayUni action URL，跟完跳轉 ───────────────────
  let finalHtml = "";
  let fetchResult: ProbeResult["fetchResult"];
  try {
    // 組 form-urlencoded body
    const bodyParams = new URLSearchParams(parsedForm!.fields);

    /**
     * 以下 header 的設計邏輯（探測重點一）：
     *
     * - User-Agent：模擬一般 Chrome 瀏覽器，避免被 PayUni 以 UA 篩掉
     * - Accept：HTML 優先，讓伺服器知道我們期望 HTML 回應
     * - Referer：設為 BVSHOP 後台，因為正常使用者就是從那裡 submit form
     * - Origin：同上，模擬 form 從 BVSHOP 後台提交的場景
     *
     * 這些 header 是否足以通過 PayUni 的 referer/origin 驗證，
     * 正是本探測要回答的關鍵問題之一。若 Worker 被擋，
     * 可能需要 session cookie（Workers 環境無法取得），代表方案不可行。
     */
    const fetchResponse = await fetch(parsedForm!.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": BROWSER_UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8",
        "Referer": "https://bvshop-manage.bvshop.tw/",
        "Origin": "https://bvshop-manage.bvshop.tw",
      },
      body: bodyParams.toString(),
      // redirect: 'follow' 是 fetch 預設值，Cloudflare Workers 會跟隨 30x 跳轉
      redirect: "follow",
    });

    finalHtml = await fetchResponse.text();
    const contentType = fetchResponse.headers.get("content-type");
    const finalUrl = fetchResponse.url;

    const heuristics = {
      has交貨便: finalHtml.includes("交貨便"),
      has7ELEVEN: finalHtml.includes("7-ELEVEN"),
      has統一超商: finalHtml.includes("統一超商"),
      hasC2C: finalHtml.includes("C2C"),
      has交貨便服務代碼: finalHtml.includes("交貨便服務代碼"),
      has物流條碼: finalHtml.includes("物流條碼"),
      looks711: false,
    };
    heuristics.looks711 =
      heuristics.has交貨便 ||
      heuristics.has7ELEVEN ||
      heuristics.has統一超商 ||
      heuristics.has交貨便服務代碼;

    fetchResult = {
      status: fetchResponse.status,
      finalUrl,
      redirected: fetchResponse.redirected,
      contentType,
      htmlLength: finalHtml.length,
      htmlSnippet: finalHtml.slice(0, 1000),
      heuristics,
    };
    result.fetchResult = fetchResult;

    result.steps.push({
      step: "3. POST 到 PayUni 並跟完跳轉",
      ok: fetchResponse.ok,
      detail: {
        status: fetchResponse.status,
        finalUrl,
        redirected: fetchResponse.redirected,
        contentType,
        htmlLength: finalHtml.length,
        looks711: heuristics.looks711,
      },
    });
  } catch (e) {
    result.steps.push({ step: "3. POST 到 PayUni 並跟完跳轉", ok: false, error: String(e) });
    // 即使這步失敗也繼續，統一由 verdict 判斷
  }

  // ── 步驟 4：抓取 HTML 中的圖片（最多 8 張）並嘗試 base64 ────────
  const imageResults: ImageProbeResult[] = [];
  let firstBase64Prefix: string | undefined;

  if (finalHtml) {
    const finalUrl = fetchResult?.finalUrl ?? parsedForm!.action;
    const srcs = extractImgSrcs(finalHtml, 8);

    result.steps.push({
      step: "4. 解析 HTML 中的 img 標籤",
      ok: true,
      detail: { imgCount: srcs.length, srcs },
    });

    for (const src of srcs) {
      const absoluteUrl = toAbsoluteUrl(src, finalUrl);
      const imgResult: ImageProbeResult = {
        src,
        absoluteUrl,
        status: null,
        contentType: null,
        bytes: null,
        base64ok: false,
      };

      try {
        const imgResp = await fetch(absoluteUrl, {
          headers: {
            "Referer": finalUrl,
            "User-Agent": BROWSER_UA,
          },
        });
        imgResult.status = imgResp.status;
        imgResult.contentType = imgResp.headers.get("content-type");

        const buf = await imgResp.arrayBuffer();
        imgResult.bytes = buf.byteLength;
        imgResult.base64ok = imgResp.ok && buf.byteLength > 0;

        // 只對「第一張成功」的圖回傳 base64 前 100 字作為佐證樣本
        if (imgResult.base64ok && firstBase64Prefix === undefined) {
          const b64 = arrayBufferToBase64(buf);
          imgResult.base64Prefix = b64.slice(0, 100);
          firstBase64Prefix = imgResult.base64Prefix;
        }
      } catch (e) {
        imgResult.error = String(e);
      }

      imageResults.push(imgResult);
    }

    result.images = imageResults;

    const fetchedImages = imageResults.filter((r) => r.status !== null);
    const allBase64ok = fetchedImages.length > 0 && fetchedImages.every((r) => r.base64ok);
    result.steps.push({
      step: "5. 逐一 fetch 圖片並測試 base64",
      ok: fetchedImages.length > 0,
      detail: {
        totalImgs: srcs.length,
        fetchedImgs: fetchedImages.length,
        allBase64ok,
        summary: imageResults.map((r) => ({
          url: r.absoluteUrl,
          status: r.status,
          bytes: r.bytes,
          base64ok: r.base64ok,
        })),
      },
    });
  } else {
    result.steps.push({ step: "4-5. 圖片探測跳過", ok: false, detail: "無法取得最終 HTML" });
  }

  // ── 步驟 5：綜合判斷 verdict ──────────────────────────────────────
  const looks711 = fetchResult?.heuristics.looks711 ?? false;
  const allImgsOk =
    (result.images?.length ?? 0) > 0 &&
    result.images!.every((r) => r.base64ok);
  const someImgsOk =
    (result.images?.length ?? 0) > 0 &&
    result.images!.some((r) => r.base64ok);

  if (looks711 && allImgsOk) {
    result.verdict =
      "🟢 可行：Worker 取得 7-11 HTML 且圖片可內嵌，交叉合併 PDF 方案成立";
  } else if (looks711 && someImgsOk) {
    result.verdict =
      "🟡 部分可行：HTML 取得但部分圖片無法內嵌，需進一步處理（QR/條碼來源限制）";
  } else if (looks711 && !someImgsOk) {
    result.verdict =
      "🟡 部分可行：HTML 取得但圖片無法內嵌，需進一步處理（QR/條碼來源限制）";
  } else {
    result.verdict =
      "🔴 受阻：見 steps 詳情，PayUni 可能擋 Worker 或需要額外驗證";
  }

  return corsJson(result);
}

// ────────────────────────────────────────────────────────────────────
// Worker entry point
// ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // OPTIONS 預檢（CORS preflight）
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // GET /health
    if (method === "GET" && url.pathname === "/health") {
      return corsJson({ ok: true, ts: Date.now() });
    }

    // POST /probe/payuni
    if (method === "POST" && url.pathname === "/probe/payuni") {
      return handleProbePayuni(request);
    }

    // 其他路徑
    return corsJson({ error: "Not Found", path: url.pathname }, 404);
  },
} satisfies ExportedHandler;
