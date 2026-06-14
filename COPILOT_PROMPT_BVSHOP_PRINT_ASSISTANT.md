# 給 Copilot 的開發提示詞

請閱讀 `BVSHOP_PRINT_ASSISTANT_COPILOT_SPEC.md`，依照規格建立 BVSHOP 出貨列印助手 MVP。

核心目標：

- React/Vite 前端 + Node/Express Server + TypeScript。
- Server 代理 BVSHOP API，前端不可直接保存 BVSHOP Token。
- 從 BVSHOP `/orders?withDetail=1` 取得訂單。
- 支援勾選訂單、拖曳排序、產生流水號 `001 / 025`。
- 自行產生 100x150mm 熱感出貨明細。
- 物流單與出貨明細都要印同一組流水號。
- 先完整支援黑貓 `/order-logistic/tcat` 的 raw pdf 合併。
- 綠界 `/order-logistic/ecpay`、統一金流 `/order-logistic/payuni`、順豐 `/order-logistic/sf` 先建立 adapter，處理 html form / printUrl，若無法自動合併則回傳 manual print 狀態。
- 不使用新增訂單 API。
- 更新訂單 API 只做第二階段手動選項，MVP 不自動改訂單狀態。

請先建立 repo 架構、型別、API client、server routes，再建立前端 UI。
