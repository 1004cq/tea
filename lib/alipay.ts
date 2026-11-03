import { AlipaySdk } from "alipay-sdk";
import { mkdir, appendFile } from "fs/promises";
import path from "path";

/**
 * Alipay AI Pay (Vibe Pay / AI 网页应用收款) helpers.
 * Secrets stay server-side. Default gateway is production; override AIPAY_GATEWAY for sandbox.
 */

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

let cachedSdk: AlipaySdk | null = null;

export function getAlipayGateway(): string {
  return (
    process.env.AIPAY_GATEWAY?.trim() ||
    "https://openapi.alipay.com/gateway.do"
  );
}

export function getAlipayBaseUrl(): string {
  return (
    process.env.AIPAY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://shop.duojiayi.com"
  ).replace(/\/$/, "");
}

/** Sync return after payment (browser redirect). */
export function getAlipayReturnUrl(): string {
  const custom = process.env.AIPAY_RETURN_URL?.trim();
  if (custom) return custom;
  return `${getAlipayBaseUrl()}/aipay`;
}

/** Async notify URL (Alipay server POST). */
export function getAlipayNotifyUrl(): string {
  const custom = process.env.AIPAY_NOTIFY_URL?.trim();
  if (custom) return custom;
  return `${getAlipayBaseUrl()}/aipay/notify`;
}

export function isAlipayConfigured(): boolean {
  return Boolean(
    process.env.AIPAY_APP_ID?.trim() &&
      (process.env.AIPAY_PRIVATE_PKCS_KEY?.trim() ||
        process.env.AIPAY_PRIVATE_KEY?.trim()) &&
      process.env.AIPAY_ALIPAY_PUBLIC_KEY?.trim()
  );
}

export function getAlipaySdk(): AlipaySdk {
  if (cachedSdk) return cachedSdk;

  const appId = requireEnv("AIPAY_APP_ID");
  // Non-Java panel key is PKCS#1; Java-labeled key is PKCS#8.
  const pkcsKey = process.env.AIPAY_PRIVATE_PKCS_KEY?.trim();
  const javaKey = process.env.AIPAY_PRIVATE_KEY?.trim();
  const usingPkcsKey = Boolean(pkcsKey);
  const privateKey = normalizeKey(pkcsKey || javaKey || requireEnv("AIPAY_PRIVATE_KEY"));
  const alipayPublicKey = normalizeKey(requireEnv("AIPAY_ALIPAY_PUBLIC_KEY"));
  const keyType =
    (process.env.AIPAY_KEY_TYPE?.trim() as "PKCS1" | "PKCS8" | undefined) ||
    (usingPkcsKey ? "PKCS1" : "PKCS8");

  cachedSdk = new AlipaySdk({
    appId,
    privateKey,
    alipayPublicKey,
    signType: "RSA2",
    keyType,
    gateway: getAlipayGateway(),
    charset: "utf-8",
  });

  return cachedSdk;
}

export function createOutTradeNo(productId: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const safeProduct = productId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return `FQ${stamp}${rand}${safeProduct}`.slice(0, 64);
}

/** Subject must not contain special chars such as /, =, &. */
export function sanitizeAlipaySubject(subject: string): string {
  return subject
    .replace(/[/=&<>'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 256);
}

export type CreateAlipayPagePayInput = {
  outTradeNo: string;
  subject: string;
  /** Amount in CNY yuan, two decimal places. */
  totalAmount: string;
  body?: string;
  productId?: string;
};

/**
 * Build a browser redirect URL for alipay.trade.page.pay (GET).
 * Client should navigate to the returned URL.
 */
export function createAlipayPagePayUrl(
  input: CreateAlipayPagePayInput
): string {
  const sdk = getAlipaySdk();
  const url = sdk.pageExecute("alipay.trade.page.pay", "GET", {
    notifyUrl: getAlipayNotifyUrl(),
    returnUrl: getAlipayReturnUrl(),
    bizContent: {
      out_trade_no: input.outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      subject: sanitizeAlipaySubject(input.subject),
      total_amount: input.totalAmount,
      body: input.body
        ? sanitizeAlipaySubject(input.body)
        : undefined,
      passback_params: input.productId
        ? encodeURIComponent(input.productId)
        : undefined,
      qr_pay_mode: "2",
    },
  });

  return url;
}

export function verifyAlipayNotify(
  params: Record<string, string>
): boolean {
  const sdk = getAlipaySdk();
  try {
    if (sdk.checkNotifySign(params)) return true;
    return sdk.checkNotifySignV2(params);
  } catch (error) {
    console.error("[alipay] notify sign verify error", error);
    return false;
  }
}

export async function queryAlipayTrade(input: {
  outTradeNo?: string;
  tradeNo?: string;
}): Promise<Record<string, unknown>> {
  const sdk = getAlipaySdk();
  const result = await sdk.exec("alipay.trade.query", {
    bizContent: {
      out_trade_no: input.outTradeNo,
      trade_no: input.tradeNo,
    },
  });
  return result as Record<string, unknown>;
}

export async function appendAlipayEvent(
  kind: string,
  payload: Record<string, unknown>
): Promise<void> {
  const logFile =
    process.env.AIPAY_EVENT_LOG_FILE?.trim() ||
    "/var/lib/fengqing-dianhong-shop/alipay-events.jsonl";

  try {
    await mkdir(path.dirname(logFile), { recursive: true });
    const line = JSON.stringify({
      at: new Date().toISOString(),
      kind,
      ...payload,
    });
    await appendFile(logFile, `${line}\n`, "utf8");
  } catch (error) {
    console.error("[alipay] failed to append event log", error);
  }
}

export function formatCnyAmount(price: number): string {
  if (!Number.isFinite(price) || price < 0.01) {
    throw new Error("Alipay amount must be at least 0.01 CNY");
  }
  return price.toFixed(2);
}
