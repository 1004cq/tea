/**
 * Server-side PayPal helpers.
 * Secret stays on the server — never import this module from Client Components.
 * HTTP error bodies are logged here and are not included on thrown Error messages.
 */

import { centsToPayPalValue, isPayPalOrderId } from "@/lib/paypal-order-guard";

const PAYPAL_MODE = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";

export const PAYPAL_API_BASE =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export function getPayPalCurrency(): string {
  return (process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD").toUpperCase();
}

function getPayPalClientId(): string {
  return (
    process.env.PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    ""
  ).trim();
}

const REDACTED_LOG_KEYS = new Set([
  "payer",
  "payment_source",
  "email_address",
  "email",
  "phone",
  "phone_number",
  "national_number",
  "given_name",
  "surname",
  "full_name",
  "address",
  "shipping",
  "account_id",
  "payer_id",
]);

function redactForLog(body: string): string {
  const clipped = body.length > 4000 ? `${body.slice(0, 4000)}…` : body;
  try {
    return JSON.stringify(redactValue(JSON.parse(clipped) as unknown));
  } catch {
    return clipped.replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[redacted-email]"
    );
  }
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[redacted-email]"
    );
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = REDACTED_LOG_KEYS.has(key) ? "[redacted]" : redactValue(child);
  }
  return output;
}

async function throwPayPalHttpError(
  response: Response,
  operation: string
): Promise<never> {
  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "";
  }
  console.error(`[paypal] ${operation} failed`, {
    status: response.status,
    body: redactForLog(body),
  });
  throw new Error("PayPal request failed");
}

/** OAuth2 client-credentials access token */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = getPayPalClientId();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PayPal credentials. Set PAYPAL_CLIENT_ID (or NEXT_PUBLIC_PAYPAL_CLIENT_ID) and PAYPAL_CLIENT_SECRET."
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    await throwPayPalHttpError(response, "auth");
  }

  const data = (await response.json()) as { access_token?: unknown };
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("PayPal request failed");
  }
  return data.access_token;
}

export type CreateOrderPayload = {
  productId: string;
  productName: string;
  amountCents: number;
  currency: string;
  customId: string;
};

export type PayPalOrder = {
  id?: string;
  status?: string;
  intent?: string;
  purchase_units?: unknown;
};

function payPalLabel(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 127 ? trimmed.slice(0, 127) : trimmed;
}

/** Create a PayPal checkout order for a single catalog line. */
export async function createPayPalOrder(
  payload: CreateOrderPayload
): Promise<PayPalOrder> {
  if (
    !Number.isSafeInteger(payload.amountCents) ||
    payload.amountCents <= 0 ||
    !/^[A-Z]{3}$/.test(payload.currency) ||
    !/^[a-f0-9]{32}$/.test(payload.customId)
  ) {
    throw new Error("Invalid PayPal order payload");
  }

  const accessToken = await getPayPalAccessToken();
  const amountValue = centsToPayPalValue(payload.amountCents);
  const label = payPalLabel(payload.productName);

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      // Without this, PayPal returns only {id,status,links} and our
      // purchase_units linkage check rejects the order as a mismatch.
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: payload.productId,
          custom_id: payload.customId,
          description: label,
          amount: {
            currency_code: payload.currency,
            value: amountValue,
            breakdown: {
              item_total: {
                currency_code: payload.currency,
                value: amountValue,
              },
            },
          },
          items: [
            {
              name: label,
              sku: payload.productId,
              quantity: "1",
              unit_amount: {
                currency_code: payload.currency,
                value: amountValue,
              },
            },
          ],
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        brand_name: "Fengqing Dianhong",
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    await throwPayPalHttpError(response, "create order");
  }

  return (await response.json()) as PayPalOrder;
}

function paypalOrderUrl(orderId: string): string {
  if (!isPayPalOrderId(orderId)) {
    throw new Error("Invalid PayPal order id");
  }
  return `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`;
}

/** Read an order back before capture so amount and line items can be checked. */
export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(paypalOrderUrl(orderId), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwPayPalHttpError(response, "get order");
  }

  return (await response.json()) as PayPalOrder;
}

/** Capture an approved PayPal order. The thrown message never includes the response body. */
export async function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalOrderUrl(orderId)}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwPayPalHttpError(response, "capture");
  }

  return (await response.json()) as PayPalOrder;
}

/** Verify a PayPal webhook signature (server-side). */
export async function verifyPayPalWebhook(params: {
  headers: Record<string, string | string[] | undefined>;
  body: string;
}): Promise<boolean> {
  const webhookId = (process.env.PAYPAL_WEBHOOK_ID || "").trim();
  if (!webhookId) {
    // Without a webhook ID we still accept and log, but mark unverified.
    return false;
  }

  const accessToken = await getPayPalAccessToken();
  const transmissionId = String(params.headers["paypal-transmission-id"] || "");
  const transmissionTime = String(
    params.headers["paypal-transmission-time"] || ""
  );
  const certUrl = String(params.headers["paypal-cert-url"] || "");
  const authAlgo = String(params.headers["paypal-auth-algo"] || "");
  const transmissionSig = String(
    params.headers["paypal-transmission-sig"] || ""
  );

  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(params.body),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    await throwPayPalHttpError(response, "webhook verify");
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
