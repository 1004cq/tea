import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { verifyPayPalWebhook } from "@/lib/paypal";
import { getShopOrder, markShopOrderCaptured } from "@/lib/paypal-order-store";
import { markOrderPaidByPayPalId, upsertPaidOrderFromPayPal } from "@/lib/orders";
import { getProductById } from "@/lib/products";
import { priceToCents } from "@/lib/paypal-order-guard";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/paypal
 * Receives PayPal webhook events. Verifies signature when PAYPAL_WEBHOOK_ID is set.
 * On PAYMENT.CAPTURE.COMPLETED / CHECKOUT.ORDER.APPROVED→COMPLETED, marks the shop order paid.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  try {
    const headerMap: Record<string, string | string[] | undefined> = {};
    request.headers.forEach((value, key) => {
      headerMap[key.toLowerCase()] = value;
    });

    let verified = false;
    if ((process.env.PAYPAL_WEBHOOK_ID || "").trim()) {
      verified = await verifyPayPalWebhook({
        headers: headerMap,
        body: rawBody,
      });
      if (!verified) {
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    }

    let event: Record<string, unknown> = {};
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const logFile =
      process.env.PAYPAL_WEBHOOK_LOG_FILE ||
      path.join(process.cwd(), "data", "paypal-webhook-events.jsonl");

    await mkdir(path.dirname(logFile), { recursive: true });
    await appendFile(
      logFile,
      `${JSON.stringify({
        receivedAt: new Date().toISOString(),
        verified,
        eventType: event.event_type ?? null,
        id: event.id ?? null,
        event,
      })}\n`,
      "utf8"
    );

    await syncOrderFromWebhook(event);

    return NextResponse.json({ received: true, verified });
  } catch (error) {
    console.error(
      "[paypal-webhook]",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}

async function syncOrderFromWebhook(event: Record<string, unknown>) {
  const eventType = typeof event.event_type === "string" ? event.event_type : "";
  if (
    eventType !== "PAYMENT.CAPTURE.COMPLETED" &&
    eventType !== "CHECKOUT.ORDER.COMPLETED"
  ) {
    return;
  }

  const resource =
    event.resource && typeof event.resource === "object"
      ? (event.resource as Record<string, unknown>)
      : null;
  if (!resource) return;

  const paypalOrderId = extractPayPalOrderId(resource);
  if (!paypalOrderId) return;

  const paidAt = new Date();
  try {
    await markShopOrderCaptured(paypalOrderId);
  } catch {
    /* order may not exist in file store yet */
  }

  const existing = await markOrderPaidByPayPalId(paypalOrderId, { paidAt });
  if (existing) return;

  const shop = await getShopOrder(paypalOrderId);
  const product = shop ? getProductById(shop.productId) : undefined;
  const amountCents =
    shop?.amountCents ??
    extractAmountCents(resource) ??
    (product ? priceToCents(product.price) : null);

  await upsertPaidOrderFromPayPal({
    paypalOrderId,
    productId: shop?.productId || extractCustomProductId(resource),
    productName: product
      ? `${product.name} (${product.nameEn})`
      : undefined,
    amountCents: amountCents ?? 0,
    currency: shop?.currency || extractCurrency(resource) || "USD",
    paidAt,
  });
}

function extractPayPalOrderId(resource: Record<string, unknown>): string | null {
  const supplementary =
    resource.supplementary_data && typeof resource.supplementary_data === "object"
      ? (resource.supplementary_data as Record<string, unknown>)
      : null;
  const related =
    supplementary?.related_ids && typeof supplementary.related_ids === "object"
      ? (supplementary.related_ids as Record<string, unknown>)
      : null;
  if (typeof related?.order_id === "string" && related.order_id.trim()) {
    return related.order_id.trim();
  }
  if (typeof resource.id === "string" && resource.id.startsWith("ORDER")) {
    return resource.id;
  }
  // Capture resources often use supplementary_data.related_ids.order_id;
  // CHECKOUT.ORDER.COMPLETED uses resource.id as the order id.
  if (typeof resource.id === "string" && /^[A-Z0-9_-]{10,40}$/i.test(resource.id)) {
    return resource.id;
  }
  return null;
}

function extractAmountCents(resource: Record<string, unknown>): number | null {
  const amount =
    resource.amount && typeof resource.amount === "object"
      ? (resource.amount as Record<string, unknown>)
      : resource.purchase_units &&
          Array.isArray(resource.purchase_units) &&
          resource.purchase_units[0] &&
          typeof resource.purchase_units[0] === "object"
        ? ((resource.purchase_units[0] as Record<string, unknown>).amount as
            | Record<string, unknown>
            | undefined)
        : undefined;
  if (!amount || typeof amount.value !== "string") return null;
  const n = Number(amount.value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function extractCurrency(resource: Record<string, unknown>): string | null {
  const amount =
    resource.amount && typeof resource.amount === "object"
      ? (resource.amount as Record<string, unknown>)
      : null;
  if (amount && typeof amount.currency_code === "string") {
    return amount.currency_code.toUpperCase();
  }
  return null;
}

function extractCustomProductId(resource: Record<string, unknown>): string | null {
  if (typeof resource.custom_id === "string") return null; // custom_id is our random hex, not product
  const units = Array.isArray(resource.purchase_units)
    ? resource.purchase_units
    : [];
  const first = units[0];
  if (first && typeof first === "object") {
    const ref = (first as Record<string, unknown>).reference_id;
    if (typeof ref === "string" && ref.trim()) return ref.trim();
  }
  return null;
}

/** Health / discovery */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: "/api/webhooks/paypal",
    webhookIdConfigured: Boolean((process.env.PAYPAL_WEBHOOK_ID || "").trim()),
  });
}
