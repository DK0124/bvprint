{\rtf1\ansi\ansicpg950\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 HelveticaNeue;}
{\colortbl;\red255\green255\blue255;\red39\green48\blue66;\red255\green255\blue255;}
{\*\expandedcolortbl;;\cssrgb\c20392\c25098\c32941;\cssrgb\c100000\c100000\c100000;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs28 \cf2 \cb3 \expnd0\expndtw0\kerning0
\outl0\strokewidth0 \strokec2 # \uc0\u26032 \u22686 \u35330 \u21934 \
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
    post:\
      summary: \uc0\u26032 \u22686 \u35330 \u21934 \
      deprecated: false\
      description: ''\
      tags:\
        - \uc0\u35330 \u21934 (Order)\
      parameters:\
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
          application/json:\
            schema:\
              type: object\
              properties:\
                customerId:\
                  type: integer\
                  description: \uc0\u39015 \u23458 ID\
                paymentId:\
                  type: integer\
                  description: \uc0\u20184 \u27454 \u26041 \u24335 ID\
                logisticId:\
                  type: integer\
                  description: \uc0\u36865 \u36008 \u26041 \u24335 ID\
                remark:\
                  type: string\
                  description: \uc0\u35330 \u21934 \u20633 \u35387 \
                deposit:\
                  type: integer\
                  description: \uc0\u35330 \u37329 (\u22635 \u20837 \u25976 \u20540 \u24460 \u20195 \u34920 \u27492 \u24373 \u35330 \u21934 \u28858 \u35330 \u37329 \u35330 \u21934 )\u27492 \u27396 \u20301 \u33287 depositOrderId\u21482 \u33021 \u25799 \u19968 \u22635 \u23531 \
                depositOrderId:\
                  type: integer\
                  description: \uc0\u38364 \u32879 \u35330 \u37329 \u35330 \u21934 (\u22635 \u20837 \u25976 \u20540 \u24460 \u20195 \u34920 \u27492 \u24373 \u35330 \u21934 \u28858 \u23614 \u27454 \u35330 \u21934 )\u27492 \u27396 \u20301 \u33287 deposit\u21482 \u33021 \u25799 \u19968 \u22635 \u23531 \
                webhook:\
                  type: string\
                  maxLength: 191\
                  description: \uc0\u35330 \u21934 \u29376 \u24907 \u22238 \u20659 \u32178 \u22336 \
                customerRemark:\
                  type: string\
                  description: \uc0\u39015 \u23458 \u20633 \u35387 \
                customizeItems:\
                  type: array\
                  items:\
                    type: object\
                    properties:\
                      name:\
                        type: string\
                        description: \uc0\u21517 \u31281 \
                      quantity:\
                        type: integer\
                        description: \uc0\u25976 \u37327 \
                      price:\
                        type: integer\
                        description: \uc0\u37329 \u38989 \
                    x-apidog-orders:\
                      - name\
                      - quantity\
                      - price\
                    required:\
                      - name\
                      - quantity\
                      - price\
                    x-apidog-ignore-properties: []\
                  description: \uc0\u33258 \u35330 \u21697 \u38917 \
                customizeSales:\
                  type: array\
                  items:\
                    type: object\
                    properties:\
                      name:\
                        type: string\
                        description: \uc0\u25240 \u25187 \u21517 \u31281 \
                      price:\
                        type: integer\
                        description: \uc0\u25240 \u25187 \u37329 \u38989 \
                        minimum: 0\
                    x-apidog-orders:\
                      - name\
                      - price\
                    required:\
                      - name\
                      - price\
                    x-apidog-ignore-properties: []\
                  description: \uc0\u25240 \u25187 \
                cvs:\
                  type: object\
                  properties:\
                    storeName:\
                      type: string\
                      description: \uc0\u38272 \u24066 \u21517 \u31281 \
                    storeNum:\
                      type: string\
                      description: \uc0\u38272 \u24066 \u24215 \u34399 \
                  x-apidog-orders:\
                    - storeName\
                    - storeNum\
                  required:\
                    - storeName\
                    - storeNum\
                  description: \uc0\u36229 \u21830 \u36039 \u26009 \
                  x-apidog-ignore-properties: []\
                logCode:\
                  type: string\
                  maxLength: 50\
                  description: \uc0\u29289 \u27969 \u23376 \u36984 \u38917 \u20195 \u30908 (\u38656 \u22312 \u35442 \u36865 \u36008 \u26041 \u24335 \u25903 \u25588 \u30340 \u28165 \u21934 \u20839 )\
                temperature:\
                  type: string\
                  enum:\
                    - '0001'\
                    - '0002'\
                    - '0003'\
                  description: \uc0\u28331 \u23652 (0001\u24120 \u28331 /0002\u20919 \u34255 /0003\u20919 \u20941 )\
                distance:\
                  type: string\
                  enum:\
                    - '00'\
                    - '01'\
                    - '02'\
                  description: \uc0\u36317 \u38626 \u21312 \u38291 (00\u21516 \u32291 \u24066 /01\u22806 \u32291 \u24066 /02\u38626 \u23798 )\
                specification:\
                  type: string\
                  enum:\
                    - '0001'\
                    - '0002'\
                    - '0003'\
                    - '0004'\
                  description: \uc0\u35215 \u26684 \
                goodsName:\
                  type: string\
                  maxLength: 50\
                  description: \uc0\u21830 \u21697 \u21517 \u31281 \
                sender:\
                  type: object\
                  properties:\
                    name:\
                      type: string\
                      maxLength: 50\
                      description: \uc0\u23492 \u20214 \u20154 \u22995 \u21517 \
                    phone:\
                      type: string\
                      description: \uc0\u23492 \u20214 \u20154 \u38651 \u35441 \
                    email:\
                      type: string\
                      format: email\
                      maxLength: 255\
                      description: \uc0\u23492 \u20214 \u20154 Email\
                    address:\
                      type: string\
                      maxLength: 255\
                      description: \uc0\u23492 \u20214 \u20154 \u22320 \u22336 \
                  x-apidog-orders:\
                    - name\
                    - phone\
                    - email\
                    - address\
                  description: \uc0\u23492 \u20214 \u20154 \u36039 \u35338 (\u26410 \u20659 \u30340 \u27396 \u20301 \u20197 \u24215 \u23478 \u38928 \u35373 \u23492 \u20214 \u22320 \u22336 \u35036 \u40778 )\
                  x-apidog-ignore-properties: []\
                receiver:\
                  type: object\
                  properties:\
                    name:\
                      type: string\
                      maxLength: 100\
                      description: \uc0\u25910 \u20214 \u20154 \u22995 \u21517 \
                    phone:\
                      type: string\
                      description: \uc0\u25910 \u20214 \u20154 \u38651 \u35441 \
                    address:\
                      type: string\
                      maxLength: 255\
                      description: \uc0\u25910 \u20214 \u20154 \u22320 \u22336 \
                    scheduledDelivery:\
                      type: string\
                      enum:\
                        - '1'\
                        - '2'\
                        - '4'\
                      description: \uc0\u38928 \u23450 \u37197 \u36865 \u26178 \u27573 \
                  x-apidog-orders:\
                    - name\
                    - phone\
                    - address\
                    - scheduledDelivery\
                  description: \uc0\u25910 \u20214 \u20154 \u36039 \u35338 (\u35206 \u23531 \u35330 \u21934 \u25910 \u20214 \u36039 \u26009 )\
                  x-apidog-ignore-properties: []\
                invoiceType:\
                  type: string\
                  enum:\
                    - personal\
                    - company\
                    - donate\
                  description: \uc0\u30332 \u31080 \u39006 \u22411 (personal\u20491 \u20154 /company\u20844 \u21496 /donate\u25424 \u36104 )\
                invoiceCode:\
                  type: string\
                  maxLength: 100\
                  description: \uc0\u30332 \u31080 \u36617 \u20855 /\u25424 \u36104 \u30908 \
                invoiceTitle:\
                  type: string\
                  maxLength: 100\
                  description: \uc0\u30332 \u31080 \u25260 \u38957 \
                invoiceTax:\
                  type: string\
                  maxLength: 8\
                  description: \uc0\u32113 \u19968 \u32232 \u34399 \
                invId:\
                  type: integer\
                  description: \uc0\u30332 \u31080 \u26381 \u21209 \u21830 ID\
                invoiceAuto:\
                  type: integer\
                  enum:\
                    - 0\
                    - 1\
                  description: \uc0\u26159 \u21542 \u33258 \u21205 \u38283 \u31435 \u30332 \u31080 (0\u21542 /1\u26159 )\
              x-apidog-orders:\
                - customerId\
                - paymentId\
                - logisticId\
                - remark\
                - deposit\
                - depositOrderId\
                - webhook\
                - customerRemark\
                - customizeItems\
                - customizeSales\
                - cvs\
                - logCode\
                - temperature\
                - distance\
                - specification\
                - goodsName\
                - sender\
                - receiver\
                - invoiceType\
                - invoiceCode\
                - invoiceTitle\
                - invoiceTax\
                - invId\
                - invoiceAuto\
              required:\
                - customerId\
                - paymentId\
                - logisticId\
                - remark\
                - customizeItems\
                - cvs\
              x-apidog-ignore-properties: []\
            examples: \{\}\
      responses:\
        '200':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  data:\
                    $ref: '#/components/schemas/OrderDetail'\
                x-apidog-orders:\
                  - data\
                required:\
                  - data\
                x-apidog-ignore-properties: []\
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
        '404':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  message:\
                    type: string\
                x-apidog-orders:\
                  - message\
                required:\
                  - message\
                x-apidog-ignore-properties: []\
              example:\
                message: No query results for model [App\\Model].\
          headers: \{\}\
          x-apidog-name: Record Not Found\
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
        '500':\
          description: ''\
          content:\
            application/json:\
              schema:\
                type: object\
                properties:\
                  message:\
                    type: string\
                x-apidog-orders:\
                  - message\
                required:\
                  - message\
                x-apidog-ignore-properties: []\
              example:\
                message: Server Error\
          headers: \{\}\
          x-apidog-name: Server Error\
      security:\
        - bearer: []\
      x-apidog-folder: \uc0\u35330 \u21934 (Order)\
      x-apidog-status: released\
      x-run-in-apidog: https://app.apidog.com/web/project/589118/apis/api-8498767-run\
components:\
  schemas:\
    OrderDetail:\
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
        paidAt:\
          type: string\
          description: \uc0\u20184 \u27454 \u26178 \u38291 \
          format: date-time\
          nullable: true\
        cancelAt:\
          type: string\
          format: date-time\
          description: \uc0\u21462 \u28040 \u26178 \u38291 \
          nullable: true\
        shipmentAt:\
          type: string\
          format: date-time\
          description: \uc0\u20986 \u36008 \u26178 \u38291 \
          nullable: true\
        shippingAt:\
          type: string\
          description: \uc0\u38928 \u35336 \u20986 \u36008 \u26178 \u38291 \
          format: date-time\
          nullable: true\
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
          enum:\
            - 1\
            - 2\
            - -1\
            - -4\
          description: \uc0\u20184 \u27454 \u29376 \u24907 \
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
        processStatus:\
          type: integer\
          description: \uc0\u32080 \u24115 \u29376 \u24907 \
          enum:\
            - 0\
            - 1\
          x-apidog-enum:\
            - value: 0\
              name: \uc0\u26410 \u23436 \u25104 \u32080 \u24115 \u27969 \u31243 \
              description: ''\
            - value: 1\
              name: \uc0\u24050 \u23436 \u25104 \u32080 \u24115 \u27969 \u31243 \
              description: ''\
        paymentMethod:\
          type: string\
          description: \uc0\u20184 \u27454 \u26041 \u24335 \
        logisticMethod:\
          type: string\
          description: \uc0\u36865 \u36008 \u26041 \u24335 \
        logisticTraceCode:\
          type: string\
          description: \uc0\u29289 \u27969 \u36861 \u36452 \u30908 \
          nullable: true\
        discountPrice:\
          type: integer\
          description: \uc0\u25240 \u25187 \u37329 \u38989 \
        companyId:\
          type: string\
          description: \uc0\u32113 \u19968 \u32232 \u34399 \
        shippingFee:\
          type: integer\
          description: \uc0\u36939 \u36027 \
        fee:\
          type: integer\
          description: \uc0\u25163 \u32396 \u36027 \
        totalPrice:\
          type: integer\
          description: \uc0\u35330 \u21934 \u32317 \u38989 \
        orderType:\
          type: integer\
          description: \uc0\u35330 \u21934 \u39006 \u22411 \
          enum:\
            - 1\
            - 2\
            - 3\
          x-apidog-enum:\
            - name: ''\
              value: 1\
              description: \uc0\u20840 \u27454 \u35330 \u21934 \
            - name: ''\
              value: 2\
              description: \uc0\u35330 \u37329 \u35330 \u21934 \
            - name: ''\
              value: 3\
              description: \uc0\u23614 \u27454 \u35330 \u21934 \
        checkoutUrl:\
          type: string\
          description: \uc0\u32080 \u24115 \u36899 \u32080 \
        receiverName:\
          type: string\
          description: \uc0\u25910 \u20214 \u20154 \
        receiverPhone:\
          type: string\
          description: \uc0\u25910 \u20214 \u20154 \u38651 \u35441 \
        receiverAddress:\
          type: string\
          description: \uc0\u25910 \u20214 \u20154 \u22320 \u22336 \
        relateOrder:\
          description: \uc0\u38364 \u32879 \u35330 \u21934  (\u23614 \u27454 /\u35330 \u37329 )\
          anyOf:\
            - $ref: '#/components/schemas/Order'\
            - type: 'null'\
        customerId:\
          type: integer\
          description: \uc0\u39015 \u23458 ID\
        orderItems:\
          type: array\
          items: &ref_0\
            $ref: '#/components/schemas/OrderItem'\
          description: \uc0\u35330 \u21934 \u21697 \u38917 \
        customizeItems:\
          type: array\
          items: *ref_0\
          description: \uc0\u35330 \u21934 \u33258 \u35330 \u21697 \u38917 \
        dealerCode:\
          type: string\
          description: \uc0\u32147 \u37559 \u20195 \u30908 \
          nullable: true\
        remark:\
          type: string\
          description: \uc0\u35330 \u21934 \u20633 \u35387 \
          nullable: true\
        cvs:\
          type: object\
          properties:\
            storeName:\
              type: string\
              description: \uc0\u38272 \u24066 \u21517 \u31281 \
            storeNum:\
              type: number\
              description: \uc0\u38272 \u24066 \u24215 \u34399 \
            storeBrand:\
              type: string\
              description: \uc0\u36229 \u21830 \u39006 \u22411 \
              enum:\
                - unifart\
                - fami\
                - okmart\
                - hilife\
              x-apidog-enum:\
                - value: unifart\
                  name: \uc0\u32113 \u19968 \u36229 \u21830 \
                  description: ''\
                - value: fami\
                  name: \uc0\u20840 \u23478 \
                  description: ''\
                - value: okmart\
                  name: OK\uc0\u36229 \u21830 \
                  description: ''\
                - value: hilife\
                  name: \uc0\u33802 \u29246 \u23500 \
                  description: ''\
          x-apidog-orders:\
            - storeName\
            - storeNum\
            - storeBrand\
          description: \uc0\u36229 \u21830 \u36039 \u35338 (\u20677 \u36865 \u36008 \u26041 \u24335 \u28858 \u36229 \u21830 \u30456 \u38364 \u26178 \u25165 \u26377 \u20540 )\
          required:\
            - storeName\
            - storeNum\
            - storeBrand\
          x-apidog-ignore-properties: []\
          nullable: true\
        utmData:\
          type: object\
          properties: \{\}\
          x-apidog-orders: []\
          description: \uc0\u35330 \u21934 utm\u21443 \u25976 \
          x-apidog-ignore-properties: []\
        invoice:\
          $ref: '#/components/schemas/Invoice'\
      required:\
        - id\
        - uid\
        - createdAt\
        - orderStatus\
        - paymentStatus\
        - logisticStatus\
        - processStatus\
        - paymentMethod\
        - logisticMethod\
        - discountPrice\
        - companyId\
        - shippingFee\
        - fee\
        - totalPrice\
        - orderType\
        - checkoutUrl\
        - receiverName\
        - receiverPhone\
        - receiverAddress\
        - relateOrder\
        - customerId\
        - orderItems\
        - customizeItems\
      x-apidog-orders:\
        - id\
        - uid\
        - createdAt\
        - paidAt\
        - cancelAt\
        - shipmentAt\
        - shippingAt\
        - orderStatus\
        - paymentStatus\
        - logisticStatus\
        - processStatus\
        - paymentMethod\
        - logisticMethod\
        - logisticTraceCode\
        - discountPrice\
        - companyId\
        - shippingFee\
        - fee\
        - totalPrice\
        - orderType\
        - checkoutUrl\
        - receiverName\
        - receiverPhone\
        - receiverAddress\
        - relateOrder\
        - customerId\
        - orderItems\
        - customizeItems\
        - dealerCode\
        - remark\
        - cvs\
        - utmData\
        - invoice\
      description: \uc0\u28858 \u23436 \u25104 \u32080 \u24115 \u27969 \u31243 \
      x-apidog-ignore-properties: []\
      x-apidog-folder: ''\
    Invoice:\
      type: object\
      properties:\
        'no':\
          type: string\
          description: \uc0\u30332 \u31080 \u34399 \u30908 \
        type:\
          type: string\
          enum:\
            - personal\
            - MOICA\
            - phone\
            - loveCode\
            - company\
          x-apidog-enum:\
            - value: personal\
              name: \uc0\u26371 \u21729 \u36617 \u20855 \
              description: ''\
            - value: MOICA\
              name: \uc0\u33258 \u28982 \u20154 \u24977 \u35657 \
              description: ''\
            - value: phone\
              name: \uc0\u25163 \u27231 \u26781 \u30908 \
              description: ''\
            - value: loveCode\
              name: \uc0\u25424 \u36104 \u30332 \u31080 \
              description: ''\
            - value: company\
              name: \uc0\u20844 \u21496 \u25142 \u30332 \u31080 \
              description: ''\
          description: \uc0\u30332 \u31080 \u39006 \u22411 \
        date:\
          type: string\
          description: \uc0\u30332 \u31080 \u26178 \u38291 \
        random:\
          type: string\
          description: \uc0\u38568 \u27231 \u30908 \
        carrier:\
          type: string\
          description: |\
            \uc0\u20381 \u29031 \u39006 \u22411 \
            \uc0\u33258 \u28982 \u20154 \u24977 \u35657  -> \u33258 \u28982 \u20154 \u24977 \u35657 \u26781 \u30908 \
            \uc0\u25163 \u27231 \u26781 \u30908  -> \u25163 \u27231 \u26781 \u30908 \
            \uc0\u25424 \u36104 \u30332 \u31080  -> \u25424 \u36104 \u30908 \
            \uc0\u20844 \u21496 \u25142 \u30332 \u31080  -> \u32113 \u19968 \u32232 \u34399 \
      x-apidog-orders:\
        - 'no'\
        - type\
        - date\
        - random\
        - carrier\
      x-apidog-ignore-properties: []\
      x-apidog-folder: ''\
    OrderItem:\
      type: object\
      properties:\
        id:\
          type: integer\
          description: \uc0\u35330 \u21934 \u21830 \u21697 ID (\u29992 \u26044 \u32232 \u36655 \u35330 \u21934 \u26178 )\
        productId:\
          type: string\
          description: |-\
            \{\uc0\u21830 \u21697 ID\}-\{\u35215 \u26684 ID\}\
            \uc0\u33509 \u21830 \u21697 \u28961 \u35215 \u26684 \u21063 \u26371 \u39023 \u31034 \
            \{\uc0\u21830 \u21697 ID\}-\
        photo:\
          type: string\
          description: \uc0\u21830 \u21697 \u22294 \u29255 \u32178 \u22336 \
        name:\
          type: string\
          description: \uc0\u21517 \u31281 \
        sku:\
          type: string\
          description: \uc0\u36008 \u34399 \
        quantity:\
          type: integer\
          description: \uc0\u25976 \u37327 \
        price:\
          type: integer\
          description: \uc0\u21934 \u20729 \
        totalPrice:\
          type: integer\
          description: \uc0\u32317 \u38989 \
        referralCode:\
          type: string\
        type:\
          type: integer\
          enum:\
            - 1\
            - 2\
            - 3\
            - 4\
          x-apidog-enum:\
            - value: 1\
              name: \uc0\u19968 \u33324 \u21830 \u21697 \
              description: ''\
            - value: 2\
              name: \uc0\u31080 \u21048 \u21830 \u21697 \
              description: ''\
            - value: 3\
              name: \uc0\u38928 \u32004 \u21830 \u21697 \
              description: ''\
            - value: 4\
              name: \uc0\u32068 \u21512 \u21830 \u21697 \
              description: ''\
          description: \uc0\u21830 \u21697 \u39006 \u22411  1 => \u19968 \u33324 \u21830 \u21697 , 2 => \u31080 \u21048 \u21830 \u21697 , 3 => \u38928 \u32004 \u21830 \u21697 , 4=>\u32068 \u21512 \u21830 \u21697 \
        combinationId:\
          type: integer\
          description: \uc0\u30070 \u21830 \u21697 \u39006 \u22411 \u28858 \u32068 \u21512 \u21830 \u21697 \u19988 \u28858 \u23376 \u21830 \u21697 \u26178 \u65292 \u26371 \u26377 \u20540 (\u23565 \u25033 \u35330 \u21934 \u27597 \u21830 \u21697 ID)\
        bookingDate:\
          type: string\
          description: \uc0\u30070 \u21830 \u21697 \u39006 \u22411 \u28858 \u38928 \u32004 \u21830 \u21697 \u26178 \u65292 \u27492 \u27396 \u20301 \u26371 \u26377 \u20540 (\u38928 \u32004 \u26178 \u38291  Ex:2020-11-05)\
      x-apidog-orders:\
        - id\
        - productId\
        - photo\
        - name\
        - sku\
        - quantity\
        - price\
        - totalPrice\
        - referralCode\
        - type\
        - combinationId\
        - bookingDate\
      required:\
        - id\
        - productId\
        - photo\
      description: \uc0\u29677 \u29677 \u12553 \u715 \u29677 \
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