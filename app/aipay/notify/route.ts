import { NextRequest, NextResponse } from "next/server";
import {
  appendAlipayEvent,
  capAlipayLogField,
  isAlipayConfigured,
  queryAlipayTrade,
  tryAppendAlipayEvent,
  verifyAlipayNotify,
} from "@/lib/alipay";
import { handleAlipayNotify } from "@/lib/alipay-notify";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

const TEXT = { "Content-Type": "text/plain; charset=utf-8" };

function formToRecord(form: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }
  return params;
}

async function readNotifyParams(
  request: NextRequest
): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) {
      if (value != null) params[key] = String(value);
    }
    return params;
  }
  const form = await request.formData();
  return formToRecord(form);
}

/**
 * POST /aipay/notify
 * Alipay asynchronous payment notification.
 * Returns plain text "success" only after the signature checks and the
 * verified event has been persisted. Any other body asks Alipay to retry.
 */
export async function POST(request: NextRequest) {
  try {
    const params = await readNotifyParams(request);
    const outcome = await handleAlipayNotify(params, {
      configured: isAlipayConfigured(),
      verify: verifyAlipayNotify,
      expectedAppId: process.env.AIPAY_APP_ID?.trim() || "",
      queryTrade: queryAlipayTrade,
      persist: appendAlipayEvent,
      audit: tryAppendAlipayEvent,
      catalogAmount: (productId) => {
        const product = getProductById(productId);
        return product ? product.price.toFixed(2) : undefined;
      },
    });
    return new NextResponse(outcome.body, {
      status: outcome.status,
      headers: TEXT,
    });
  } catch (error) {
    console.error("[aipay/notify]", error);
    const message = error instanceof Error ? error.message : String(error);
    await tryAppendAlipayEvent("notify_error", {
      message: capAlipayLogField(message, 300),
    });
    return new NextResponse("failure", { status: 500, headers: TEXT });
  }
}
