# API Usage

本專案 server 代理下列 BVSHOP API：

- `GET /orders`（參考 `api/取得訂單列表.dm`）
  - 主要參數：`startAt`、`endAt`、`orderStatus`、`paymentStatus`、`logisticStatus`、`page`、`limit`、`withDetail=1`
  - 主要回應：`data: Order[]`、`meta`（pagination）

- `GET /orders/{id}`（參考 `api/取得訂單資料.dm`）
  - 主要回應：`data: OrderDetail`

- `POST /order-logistic/ecpay`（參考 `api/產生綠界物流單.dm`）
  - multipart：`id`、`senderName`、`senderPhone`
  - 回應：`{ html: string }`

- `POST /order-logistic/payuni`（參考 `api/產生統一金流物流單.dm`）
  - multipart：`id`、`senderName`、`senderPhone`
  - 回應：`{ html: string }`

- `POST /order-logistic/tcat`（參考 `api/產生黑貓物流單.dm`）
  - multipart：`id`、`senderName`、`senderPhone`
  - 回應：`{ pdf: string }`（MVP 支援 base64 decode + raw fallback）

- `POST /order-logistic/sf`（參考 `api/產生順豐物流單.dm`）
  - multipart：`id`、`senderName`、`senderPhone`
  - 回應：`{ printUrl: string }`
