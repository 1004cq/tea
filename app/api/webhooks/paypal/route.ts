import { NextRequest, NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { verifyPayPalWebhook } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/paypal
 * Receives PayPal webhook events. Verifies signature when PAYPAL_WEBHOOK_ID is set.
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

    return NextResponse.json({ received: true, verified });
  } catch (error) {
    console.error(
      "[paypal-webhook]",
      error instanceof Error ? error.message : "unknown error"
    );
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}

/** Health / discovery */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: "/api/webhooks/paypal",
    webhookIdConfigured: Boolean((process.env.PAYPAL_WEBHOOK_ID || "").trim()),
  });
}
