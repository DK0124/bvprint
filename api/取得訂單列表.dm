{\rtf1\ansi\ansicpg950\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;\red39\green48\blue66;\red255\green255\blue255;}
{\*\expandedcolortbl;;\cssrgb\c20392\c25098\c32941;\cssrgb\c100000\c100000\c100000;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs28 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 # \uc0\u21462 \u24471 \u35330 \u21934 \u21015 \u34920 \
\
## OpenAPI Specification\
\
```yaml\
openapi: 3.0.1\
info:\
  title: ''\
  description: ''\
  version: 1.0.0\
paths:\
  /orders:\
    get:\
      summary: \uc0\u21462 \u24471 \u35330 \u21934 \u21015 \u34920 \
      deprecated: false\
      description: ''\
      tags:\
        - \uc0\u35330 \u21934 (Order)\
      parameters:\
        - name: orderStatus\
          in: query\
          description: \uc0\u35330 \u21934 \u29376 \u24907 (\u22810 \u29376 \u24907 \u35531 \u29992 ,\u38548 \u38283 )\
          required: false\
          example: '1'\
          schema:\
            type: string\
        - name: paymentStatus\
          in: query\
          description: \uc0\u20184 \u27454 \u29376 \u24907 (\u22810 \u29376 \u24907 \u35531 \u29992 ,\u38548 \u38283 )\
          required: false\
          example: '1'\
          schema:\
            type: string\
        - name: logisticStatus\
          in: query\
          description: \uc0\u20986 \u36008 \u29376 \u24907 (\u22810 \u29376 \u24907 \u35531 \u29992 ,\u38548 \u38283 )\
          required: false\
          example: '1'\
          schema:\
            type: string\
        - name: customerId\
          in: query\
          description: \uc0\u39015 \u23458 ID\
          required: false\
          example: 1\
          schema:\
            type: integer\
        - name: dealerCode\
          in: query\
          description: \uc0\u32147 \u37559 \u20195 \u30908 \
          required: false\
          example: TEST1234\
          schema:\
            type: string\
        - name: dateType\
          in: query\
          description: \uc0\u35330 \u21934 \u26178 \u38291 \u25628 \u23563 \u27396 \u20301 \
          required: false\
          example: created\
          schema:\
            type: string\
            default: created\
            enum:\
              - created\
              - paid\
              - cancel\
            x-apidog-enum:\
              - value: created\
                name: \uc0\u24314 \u31435 \u26178 \u38291 \
                description: ''\
              - value: paid\
                name: \uc0\u20184 \u27454 \u26178 \u38291 \
                description: ''\
              - value: cancel\
                name: \uc0\u21462 \u28040 \u26178 \u38291 \
                description: ''\
        - name: startAt\
          in: query\
          description: dateType\uc0\u38283 \u22987 \u26178 \u38291 \
          required: false\
          example: '2024-07-01'\
          schema:\
            type: string\
            format: date\
        - name: endAt\
          in: query\
          description: dateType\uc0\u32080 \u26463 \u26178 \u38291 \
          required: false\
          example: '2024-07-10'\
          schema:\
            type: string\
            format: date\
        - name: limit\
          in: query\
          description: \uc0\u27599 \u38913 \u24190 \u31558 (\u26368 \u22810 100)\
          required: false\
          example: 20\
          schema:\
            type: integer\
            maximum: 100\
        - name: page\
          in: query\
          description: \uc0\u38913 \u25976 \
          required: false\
          example: 1\
          schema:\
            type: integer\
        - name: withDetail\
          in: query\
          description: \uc0\u26159 \u21542 \u21253 \u21547 \u35330 \u21934 \u35443 \u32048 \u36039 \u26009 \
          required: false\
          example: 1\
          schema:\
            type: integer\
            enum:\
              - 0\
              - 1\
            x-apidog-enum:\
              - value: 0\
                name: \uc0\u21542 \
                description: ''\
              - value: 1\
                name: \uc0\u26159 \
                description: ''\
        - name: Accept\
          in: header\
          description: ''\
          required: true\
          example: application/json\
          schema:\
            type: string\
            default: application/json\
      requestBody:\
        content:\
          multipart/form-data:\
            schema:\
              type: object\
              properties: \{\}\
            example:\
              orderStatus: 1\
              paymentStatus: 1\
              createdAt:\
                start: '2024-07-07 00:00:00'\
                end: '2024-07-09 00:00:00'\
              customerId: 1\
              dealerCode: TEST1234\
      responses:\
        '200':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  data:\
                    type: array\
                    items:\
                      $ref: '#/components/schemas/Order'\
                  meta:\
                    $ref: '#/components/schemas/Paginate'\
                required:\
                  - data\
                  - meta\
                x-apidog-orders:\
                  - data\
                  - meta\
                x-apidog-ignore-properties: []\
              example:\
                data:\
                  - id: 660\
                    uid: 2407081253FRDURE\
                    createdAt: '2024-07-08 12:53:01'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 661\
                    uid: 2407081254LJAL46\
                    createdAt: '2024-07-08 12:54:19'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 662\
                    uid: 2407081255TG2657\
                    createdAt: '2024-07-08 12:55:07'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 663\
                    uid: 24070812550AW9TZ\
                    createdAt: '2024-07-08 12:55:45'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 664\
                    uid: 24070812552SSPDU\
                    createdAt: '2024-07-08 12:55:55'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 665\
                    uid: 240708130447ERLC\
                    createdAt: '2024-07-08 13:04:49'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 666\
                    uid: 24070813064AZPY7\
                    createdAt: '2024-07-08 13:06:48'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 667\
                    uid: 2407081307PAH1UU\
                    createdAt: '2024-07-08 13:07:24'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 668\
                    uid: 24070813089CPXHW\
                    createdAt: '2024-07-08 13:08:36'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 669\
                    uid: 2407081309PTELG7\
                    createdAt: '2024-07-08 13:09:22'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 670\
                    uid: 2407081313V33GE5\
                    createdAt: '2024-07-08 13:13:17'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 671\
                    uid: 24070813145K1KEP\
                    createdAt: '2024-07-08 13:14:47'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 672\
                    uid: 24070813158S0UN8\
                    createdAt: '2024-07-08 13:15:31'\
                    orderStatus: -3\
                    paymentStatus: 1\
                  - id: 673\
                    uid: 2407081328NFYZYY\
                    createdAt: '2024-07-08 13:28:08'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 674\
                    uid: 2407081328ZS28FH\
                    createdAt: '2024-07-08 13:28:27'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 675\
                    uid: 2407081329XWPJT6\
                    createdAt: '2024-07-08 13:29:21'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 676\
                    uid: 2407081329RFADPN\
                    createdAt: '2024-07-08 13:29:41'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 677\
                    uid: 2407081331Q0W1ZV\
                    createdAt: '2024-07-08 13:31:08'\
                    orderStatus: 1\
                    paymentStatus: 1\
                  - id: 678\
                    uid: 2407081332BFEYDH\
                    createdAt: '2024-07-08 13:32:23'\
                    orderStatus: -3\
                    paymentStatus: 1\
                meta:\
                  current_page: 1\
                  from: 1\
                  last_page: 1\
                  per_page: 20\
                  to: 19\
                  total: 19\
          headers: \{\}\
          x-apidog-name: Success\
        '401':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  message:\
                    type: string\
                required:\
                  - message\
                x-apidog-orders:\
                  - message\
                x-apidog-ignore-properties: []\
              example:\
                message: Unauthenticated.\
          headers: \{\}\
          x-apidog-name: Unauthenticated\
        '422':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  message:\
                    type: string\
                  errors:\
                    type: object\
                    properties:\
                      phone:\
                        type: array\
                        items:\
                          type: string\
                    required:\
                      - phone\
                    x-apidog-orders:\
                      - phone\
                    x-apidog-ignore-properties: []\
                required:\
                  - message\
                x-apidog-orders:\
                  - message\
                  - errors\
                x-apidog-ignore-properties: []\
              example:\
                message: column \uc0\u28858 \u24517 \u22635 \u27396 \u20301 \u12290 \
                errors:\
                  column:\
                    - column \uc0\u28858 \u24517 \u22635 \u27396 \u20301 \u12290 \
          headers: \{\}\
          x-apidog-name: Parameter Error\
      security:\
        - bearer: []\
      x-apidog-folder: \uc0\u35330 \u21934 (Order)\
      x-apidog-status: released\
      x-run-in-apidog: https://app.apidog.com/web/project/589118/apis/api-8379763-run\
components:\
  schemas:\
    Paginate:\
      type: object\
      properties:\
        current_page:\
          type: integer\
          description: \uc0\u30446 \u21069 \u38913 \u25976 \
        from:\
          type: integer\
          description: \uc0\u38283 \u22987 \u31558 \u25976 \
        last_page:\
          type: integer\
          description: \uc0\u26368 \u24460 \u38913 \u25976 \
        per_page:\
          type: integer\
          description: \uc0\u27599 \u38913 \u31558 \u25976 \
        to:\
          type: integer\
          description: \uc0\u32080 \u26463 \u31558 \u25976 \
        total:\
          type: integer\
          description: \uc0\u26371 \u21729 \u32317 \u25976 \
      required:\
        - current_page\
        - from\
        - last_page\
        - per_page\
        - to\
        - total\
      x-apidog-orders:\
        - current_page\
        - from\
        - last_page\
        - per_page\
        - to\
        - total\
      x-apidog-ignore-properties: []\
      x-apidog-folder: ''\
    Order:\
      type: object\
      properties:\
        id:\
          type: integer\
          description: \uc0\u35330 \u21934 ID\
        uid:\
          type: string\
          description: \uc0\u35330 \u21934 \u32232 \u34399 \
        createdAt:\
          type: string\
          description: \uc0\u24314 \u31435 \u26178 \u38291 \
          format: date-time\
        orderStatus:\
          type: integer\
          description: \uc0\u35330 \u21934 \u29376 \u24907 \
          enum:\
            - 1\
            - 2\
            - 4\
            - -1\
            - -3\
          x-apidog-enum:\
            - name: ''\
              value: 1\
              description: \uc0\u24050 \u25104 \u31435 \
            - name: ''\
              value: 2\
              description: \uc0\u24453 \u30906 \u35469 \
            - name: ''\
              value: 4\
              description: \uc0\u24050 \u23436 \u25104 \
            - name: ''\
              value: -1\
              description: \uc0\u30064 \u24120 \u21934 \
            - name: ''\
              value: -3\
              description: \uc0\u24050 \u21462 \u28040 \
        paymentStatus:\
          type: integer\
          description: \uc0\u20184 \u27454 \u29376 \u24907 \
          enum:\
            - 1\
            - 2\
            - -1\
            - -4\
          x-apidog-enum:\
            - name: ''\
              value: 1\
              description: \uc0\u26410 \u20184 \u27454 \
            - name: ''\
              value: 2\
              description: \uc0\u24050 \u20184 \u27454 \
            - name: ''\
              value: -1\
              description: \uc0\u24050 \u36864 \u27454 \
            - name: ''\
              value: -4\
              description: \uc0\u24050 \u36926 \u26399 \
        logisticStatus:\
          type: integer\
          description: \uc0\u20986 \u36008 \u29376 \u24907 \
          enum:\
            - 1\
            - 2\
            - 3\
            - 4\
            - 5\
            - 6\
            - -1\
          x-apidog-enum:\
            - name: ''\
              value: 1\
              description: \uc0\u26410 \u20986 \u36008 \
            - name: ''\
              value: 2\
              description: \uc0\u34389 \u29702 \u20013 \
            - name: ''\
              value: 3\
              description: \uc0\u24050 \u20986 \u36008 \
            - name: ''\
              value: 4\
              description: \uc0\u24050 \u37197 \u36948 \
            - name: ''\
              value: 5\
              description: \uc0\u24050 \u21462 \u36008 \
            - name: ''\
              value: 6\
              description: \uc0\u36864 \u22238 \u20013 \
            - value: -1\
              name: ''\
              description: \uc0\u24050 \u36864 \u36008 \
        checkoutUrl:\
          type: string\
          description: \uc0\u32080 \u24115 \u36899 \u32080 \
      required:\
        - id\
        - uid\
        - createdAt\
        - orderStatus\
        - paymentStatus\
        - logisticStatus\
        - checkoutUrl\
      x-apidog-orders:\
        - id\
        - uid\
        - createdAt\
        - orderStatus\
        - paymentStatus\
        - logisticStatus\
        - checkoutUrl\
      x-apidog-ignore-properties: []\
      x-apidog-folder: ''\
  securitySchemes:\
    bearer:\
      type: http\
      scheme: bearer\
servers:\
  - url: https://bvshop-manage.bv-shop.tw/api/v2\
    description: Develop Env\
  - url: https://bvshop-manage.bvshop.tw/api/v2\
    description: Prod Env\
security:\
  - bearer: []\
\
```}