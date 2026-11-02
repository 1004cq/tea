/**
 * Server-side PayPal helpers.
 * Secret stays on the server — never import this module from Client Components.
 */

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
    const detail = await response.text();
    throw new Error(`PayPal auth failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export type CreateOrderPayload = {
  productId: string;
  productName: string;
  amount: number;
  currency: string;
};

/** Create a PayPal checkout order for a single product */
export async function createPayPalOrder(
  payload: CreateOrderPayload
): Promise<{ id: string }> {
  const accessToken = await getPayPalAccessToken();
  const amountValue = payload.amount.toFixed(2);

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: payload.productId,
          description: payload.productName,
          amount: {
            currency_code: payload.currency,
            value: amountValue,
          },
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
    const detail = await response.text();
    throw new Error(`PayPal create order failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as { id: string };
}

/** Capture an approved PayPal order */
export async function capturePayPalOrder(
  orderId: string
): Promise<Record<string, unknown>> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal capture failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as Record<string, unknown>;
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
    const detail = await response.text();
    throw new Error(`PayPal webhook verify failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
