/**
 * ============================================================
 * sfLabelProbe.ts — 順豐物流單可行性探測腳本
 * ⚠️  純 DEBUG / 調查用途，不屬於正式列印流程，請勿在 UI 中依賴此模組
 * ============================================================
 *
 * 【如何手動執行】
 *  1. 在測試站（https://bvshop-manage.bv-shop.tw）任意 /order* 頁面
 *     打開 DevTools → Console
 *  2. 將下方整個檔案內容貼入 Console，或直接貼以下呼叫片段：
 *
 *     // 測試訂單 10541（已在 BVSHOP 建立好順豐物流單）
 *     window.__probeSfLabel = probeSfLabel;
 *     probeSfLabel(10541).then(r => { window.__sfProbeResult = r; console.log('✅ 結果:', r); });
 *
 *  3. 把 console 印出的 JSON 物件貼回給開發者分析
 *
 * 【策略說明】
 *  A. fetch + redirect:follow  → 最終能拿到 PDF bytes 嗎？
 *  B. fetch + redirect:manual  → 能拿到 302 Location（順豐帶 token 的 URL）嗎？
 *  C. 若 B 能拿到 Location，直接 fetch 順豐 URL 看 CORS 狀況
 *  D. 分析性：iframe / chrome.tabs.create 方案（僅報告，不執行 fetch）
 *
 * 【注意】
 *  - 使用當前頁面 origin（window.location.origin），不 hardcode 網域
 *  - 此調查在測試站 bvshop-manage.bv-shop.tw 進行，訂單 10541
 *  - 所有例外都被 try/catch，不會中斷探測
 */

// ---- 結果型別 ------------------------------------------------

export interface StrategyResult {
  /** 是否嘗試過此策略 */
  attempted: boolean;
  /** fetch response.ok */
  ok?: boolean;
  /** HTTP status code */
  status?: number;
  /** response.type: 'basic' | 'cors' | 'opaque' | 'opaqueredirect' | 'error' */
  responseType?: string;
  /** 最終落地 URL（response.url） */
  finalUrl?: string;
  /** 是否被 302 重新導向（response.redirected） */
  redirected?: boolean;
  /** Content-Type header */
  contentType?: string | null;
  /** 嘗試 response.blob() 是否成功 */
  blobSuccess?: boolean;
  /** blob.size（bytes） */
  blobSize?: number;
  /** blob.type（MIME type） */
  blobType?: string;
  /** 錯誤訊息（若有） */
  error?: string;
  /** 補充說明 */
  note?: string;
}

export interface SfLabelProbeResult {
  /** 探測時間（ISO） */
  probedAt: string;
  /** 使用的 origin */
  origin: string;
  /** 測試訂單 ID */
  orderId: number | string;
  /** 目標同源 URL */
  targetUrl: string;
  strategyA: StrategyResult;
  strategyB: StrategyResult;
  strategyC: StrategyResult;
  strategyD: { note: string };
  /** 綜合判斷（根據各策略結果自動給出） */
  verdict: string;
}

// ---- 探測主函式 -----------------------------------------------

/**
 * 探測順豐物流單 PDF 抓取可行性
 *
 * @param orderId  BVSHOP 訂單 ID（測試用 10541）
 * @returns        結構化結果物件，同時 console.log 方便複製
 *
 * @example
 *   probeSfLabel(10541).then(r => console.log(JSON.stringify(r, null, 2)));
 */
export async function probeSfLabel(
  orderId: number | string
): Promise<SfLabelProbeResult> {
  const origin = window.location.origin;
  const path = `/order_multi_print_sf_logistics?ids=${orderId}`;
  const targetUrl = `${origin}${path}`;

  const result: SfLabelProbeResult = {
    probedAt: new Date().toISOString(),
    origin,
    orderId,
    targetUrl,
    strategyA: { attempted: false },
    strategyB: { attempted: false },
    strategyC: { attempted: false },
    strategyD: { note: '' },
    verdict: '',
  };

  console.group(`[sfLabelProbe] 🔍 探測順豐物流單 orderId=${orderId}`);
  console.log('origin:', origin);
  console.log('targetUrl:', targetUrl);

  // ── 策略 A：fetch + redirect:follow ────────────────────────
  console.group('策略 A — fetch(redirect:follow)');
  result.strategyA.attempted = true;
  try {
    const res = await fetch(targetUrl, {
      credentials: 'include',
      redirect: 'follow',
    });

    result.strategyA.ok = res.ok;
    result.strategyA.status = res.status;
    result.strategyA.responseType = res.type;
    result.strategyA.finalUrl = res.url;
    result.strategyA.redirected = res.redirected;
    result.strategyA.contentType = res.headers.get('content-type');

    if (res.type === 'opaque') {
      result.strategyA.note =
        '⛔ response.type=opaque：fetch 跟到了跨網域，但 CORS 擋住，無法讀取任何 header 或 body';
      console.warn(result.strategyA.note);
    } else {
      // 嘗試讀 blob
      try {
        const blob = await res.blob();
        result.strategyA.blobSuccess = true;
        result.strategyA.blobSize = blob.size;
        result.strategyA.blobType = blob.type;
        result.strategyA.note =
          blob.type.includes('pdf') || blob.size > 1000
            ? '✅ 成功取得 blob，看起來是 PDF'
            : `⚠️ 取得 blob 但 MIME 非 PDF（${blob.type}，${blob.size} bytes）`;
      } catch (blobErr) {
        result.strategyA.blobSuccess = false;
        result.strategyA.note = `⛔ 讀 blob 失敗：${String(blobErr)}`;
      }
    }
  } catch (err) {
    result.strategyA.error = String(err);
    result.strategyA.note = `⛔ fetch 本身拋例外：${String(err)}`;
  }
  console.log('strategyA:', result.strategyA);
  console.groupEnd();

  // ── 策略 B：fetch + redirect:manual ────────────────────────
  console.group('策略 B — fetch(redirect:manual)');
  result.strategyB.attempted = true;
  try {
    const res = await fetch(targetUrl, {
      credentials: 'include',
      redirect: 'manual',
    });

    result.strategyB.ok = res.ok;
    result.strategyB.status = res.status;
    result.strategyB.responseType = res.type;
    result.strategyB.finalUrl = res.url;
    result.strategyB.redirected = res.redirected;

    // redirect:manual 時若有 302，瀏覽器回 opaqueredirect，Location 讀不到
    const location = res.headers.get('location');
    if (location) {
      // 理論上瀏覽器不會讓我們讀到，但如果能拿到記下來
      result.strategyB.note = `✅ 拿到 Location header：${location}`;
      result.strategyB.contentType = location; // 借用欄位記 location
    } else {
      result.strategyB.note =
        res.type === 'opaqueredirect'
          ? '⛔ response.type=opaqueredirect：302 被封裝，Location header 不可讀（瀏覽器安全限制）'
          : `ℹ️ 無 Location header，response.type=${res.type}，status=${res.status}`;
    }
  } catch (err) {
    result.strategyB.error = String(err);
    result.strategyB.note = `⛔ fetch 拋例外：${String(err)}`;
  }
  console.log('strategyB:', result.strategyB);
  console.groupEnd();

  // ── 策略 C：直接 fetch 順豐 URL（需先從 B 拿到 Location） ─
  console.group('策略 C — 直接 fetch 順豐 URL');
  result.strategyC.attempted = true;

  // 判斷 B 是否拿到了 Location（通常不行）
  const sfLocationFromB =
    result.strategyB.note?.startsWith('✅ 拿到 Location header：')
      ? result.strategyB.contentType // 上面借用了 contentType 存 location
      : null;

  if (sfLocationFromB) {
    console.log('策略 B 有拿到 Location，嘗試直接 fetch：', sfLocationFromB);
    try {
      const res = await fetch(sfLocationFromB, {
        credentials: 'omit',
        redirect: 'follow',
      });
      result.strategyC.ok = res.ok;
      result.strategyC.status = res.status;
      result.strategyC.responseType = res.type;
      result.strategyC.finalUrl = res.url;
      result.strategyC.contentType = res.headers.get('content-type');
      const corsHeader = res.headers.get('access-control-allow-origin');

      if (res.type === 'opaque' || res.type === 'cors') {
        result.strategyC.note =
          res.type === 'cors'
            ? `✅ CORS 通過，Access-Control-Allow-Origin: ${corsHeader ?? '(未回傳)'}`
            : `⛔ 跨網域 opaque，無法讀取 body（無 CORS header）`;
      }

      if (res.ok && res.type !== 'opaque') {
        try {
          const blob = await res.blob();
          result.strategyC.blobSuccess = true;
          result.strategyC.blobSize = blob.size;
          result.strategyC.blobType = blob.type;
        } catch (blobErr) {
          result.strategyC.blobSuccess = false;
          result.strategyC.error = String(blobErr);
        }
      }
    } catch (err) {
      result.strategyC.error = String(err);
      result.strategyC.note = `⛔ fetch 順豐 URL 拋例外：${String(err)}`;
    }
  } else {
    result.strategyC.note =
      '⛔ 此路線不可行：策略 B 因 opaqueredirect 拿不到 Location，無法取得帶 token 的順豐 URL';
    console.warn(result.strategyC.note);
  }
  console.log('strategyC:', result.strategyC);
  console.groupEnd();

  // ── 策略 D：分析性說明（不執行 fetch） ─────────────────────
  result.strategyD.note = [
    '【策略 D：隱藏 iframe / chrome.tabs.create 分析】',
    '',
    '隱藏 iframe 載入跨網域 PDF：',
    '  - 瀏覽器安全限制：跨網域 iframe 內容無法被父頁面讀取（no cross-origin access）',
    '  - 無論 PDF 是否成功顯示，都無法從 iframe.contentDocument 取得 bytes',
    '  - 結論：❌ 無法取得 PDF bytes',
    '',
    'chrome.tabs.create 開新分頁：',
    '  - 瀏覽器跟著 302 跳到順豐 PDF 分頁是可行的（等同使用者手動點按鈕）',
    '  - 但 content script 無法從另一個分頁讀取跨網域 PDF 的 bytes',
    '  - 只適合「讓使用者在那個分頁手動列印」，不適合程式化合併',
    '  - 結論：✅ 可讓使用者看到／列印 PDF，但 ❌ 無法程式化取得 bytes',
    '',
    '若想用 chrome.tabs.create 開啟 BVSHOP 同源頁讓它自行 302：',
    `  chrome.tabs.create({ url: '${targetUrl}' })`,
    '  → 不需要 host_permissions for iuop.sf-express.com',
    '  → 適合「分組列印」方案（物流單另頁、明細另頁）',
  ].join('\n');

  // ── 綜合判斷 ──────────────────────────────────────────────
  if (
    result.strategyA.blobSuccess &&
    result.strategyA.blobType?.includes('pdf')
  ) {
    result.verdict =
      '🟢 策略 A 成功！可取得 PDF bytes（blob）。可進行「逐筆穿插合併同一份 PDF」方案（pdf-lib + 明細 PDF 合併）。';
  } else if (
    result.strategyA.responseType === 'opaque' ||
    result.strategyA.error
  ) {
    result.verdict =
      '🔴 策略 A 被跨網域 CORS 擋住，無法取得 PDF bytes。建議退為「分組列印」方案：' +
      '用 BVSHOP 原生 order_multi_print_sf_logistics?ids=<多筆逗號分隔> 另開分頁印物流單；' +
      '明細另用現有 window.print() 印；兩者依相同排序與流水號對應。';
  } else if (result.strategyA.blobSuccess && !result.strategyA.blobType?.includes('pdf')) {
    result.verdict =
      '🟡 策略 A 拿到了回應但非 PDF（可能是 HTML 錯誤頁或 BVSHOP 回傳其他格式）。' +
      '請檢查 blobType 與 finalUrl 進一步分析。';
  } else {
    result.verdict =
      '⚪ 結果不明確，請人工檢查 strategyA 的詳細欄位。';
  }

  console.group('📋 最終結果（可複製回報）');
  console.log(JSON.stringify(result, null, 2));
  console.groupEnd();
  console.groupEnd();

  return result;
}

// 方便 DevTools Console 直接貼上執行
// 注意：此全域掛載僅用於調查，不應出現在正式流程
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['probeSfLabel'] = probeSfLabel;
}
