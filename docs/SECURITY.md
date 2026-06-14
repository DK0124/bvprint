# SECURITY

## 規格第 2 節落實

- 不將 BVSHOP API Token、物流商金鑰寫死於原始碼。
- BVSHOP API 呼叫僅由 `apps/server` 發出，前端不保存 token。
- Token 由 `.env` 讀取，提供 `.env.example`，且 `.env` 已 git ignore。
- 不長期保存顧客個資；列印任務僅 in-memory（MVP），PDF 合併於記憶體進行。

## 其他防呆

- 列印前檢查 `logisticTraceCode` 並回傳警告。
- 未確認 `confirmCreateLabels` 時不呼叫建立物流單 API。
- 未知物流方式標記警告，避免誤印。
