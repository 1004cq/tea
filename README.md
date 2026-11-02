# 凤庆滇红 · Tea Shop

高端滇红茶电商站点：Next.js（App Router）+ PayPal 结账，可部署至 Vercel。

## 功能

- 首页 / 产品 / 关于 / 联系 / 支付成功页
- 产品目录（经典滇红、金芽、陈韵、礼盒）
- PayPal JS SDK 前端按钮 + 服务端 API 创建/捕获订单（Secret 不暴露）
- 按产品金额下单，货币可通过环境变量配置（默认 USD）
- 响应式布局，深绿 / 米白 / 金色茶韵风格

## 技术栈

- Next.js 15（App Router）
- React 19
- TypeScript
- `@paypal/react-paypal-js`
- Vercel 部署

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入 PayPal Sandbox 的 Client ID / Secret

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

```bash
npm run build   # 生产构建
npm start       # 本地预览生产构建
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Client ID（前端可见） |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret（仅服务端） |
| `PAYPAL_MODE` | `sandbox` 或 `live` |
| `NEXT_PUBLIC_PAYPAL_CURRENCY` | 可选，默认 `USD` |

示例见 `.env.local.example`。请勿将真实 Secret 提交到 Git。

## 如何获取 PayPal Client ID 与 Secret

1. 打开 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 使用 PayPal 账号登录
3. 进入 **Apps & Credentials**
4. 选择 **Sandbox**（测试）或 **Live**（正式）
5. 点击 **Create App**，填写应用名称并创建
6. 创建后即可看到：
   - **Client ID** → 填入 `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - **Secret** → 填入 `PAYPAL_CLIENT_SECRET`
7. 本地测试请将 `PAYPAL_MODE=sandbox`
8. Sandbox 买家账号可在 Dashboard → **Sandbox** → **Accounts** 中查看

## PayPal 支付流程

1. 用户点击「购买」→ 前端展示 PayPal 按钮
2. 按钮 `createOrder` 调用 `POST /api/create-order`（传入 `productId`）
3. 服务端按商品目录中的价格创建 PayPal 订单，返回 `orderID`
4. 用户在 PayPal 完成授权
5. `onApprove` 调用 `POST /api/capture-order` 捕获付款
6. 成功后跳转 `/success`

金额以服务端商品目录为准，不信任前端传入的价格。

## 项目结构

```
app/
  page.tsx                 # 首页
  products/page.tsx        # 产品列表
  about/page.tsx           # 关于
  contact/page.tsx         # 联系
  success/page.tsx         # 支付成功
  api/create-order/        # 创建 PayPal 订单
  api/capture-order/       # 捕获支付
  layout.tsx
  globals.css
components/
  Header.tsx
  Footer.tsx
  ProductCard.tsx
  PayPalCheckout.tsx
lib/
  products.ts              # 商品目录
  paypal.ts                # PayPal 服务端封装
```

## 部署到 Vercel

1. 将本仓库推送到 GitHub
2. 打开 [Vercel](https://vercel.com)，Import 该仓库
3. Framework Preset 选择 **Next.js**（一般会自动识别）
4. 在 **Environment Variables** 中添加：
   - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_MODE`（上线前改为 `live`，并使用 Live 凭证）
   - `NEXT_PUBLIC_PAYPAL_CURRENCY`（可选）
5. Deploy
6. 如需绑定自定义域名：Vercel 项目 → **Settings** → **Domains**

上线前请确认：

- `PAYPAL_MODE=live` 且使用 Live Client ID / Secret
- PayPal 应用的回跳与品牌设置符合你的站点需求
- 商品价格与货币与目标市场一致

## 自定义商品

编辑 `lib/products.ts`，增减产品并设置 `id`、`price`、`name`、图片等。购买按钮会自动使用对应金额。

## 许可

Private / 自用项目。
