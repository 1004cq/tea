import { NextRequest, NextResponse } from "next/server";
import {
  appendAlipayEvent,
  isAlipayConfigured,
  queryAlipayTrade,
  verifyAlipayNotify,
} from "@/lib/alipay";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

function formToRecord(form: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }
  return params;
}

/**
 * POST /aipay/notify
 * Alipay asynchronous payment notification.
 * Must return plain text "success" after verifying signature and business fields.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAlipayConfigured()) {
      return new NextResponse("failure", { status: 503 });
    }

    const contentType = request.headers.get("content-type") || "";
    let params: Record<string, string> = {};

    if (contentType.includes("application/json")) {
      const json = (await request.json()) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) {
        if (value != null) params[key] = String(value);
      }
    } else {
      const form = await request.formData();
      params = formToRecord(form);
    }

    const signedOk = verifyAlipayNotify(params);
    if (!signedOk) {
      await appendAlipayEvent("notify_sign_failed", { params });
      return new NextResponse("failure", { status: 400 });
    }

    const appId = params.app_id || "";
    const expectedAppId = process.env.AIPAY_APP_ID?.trim() || "";
    if (expectedAppId && appId !== expectedAppId) {
      await appendAlipayEvent("notify_app_id_mismatch", { appId, params });
      return new NextResponse("failure", { status: 400 });
    }

    const outTradeNo = params.out_trade_no || "";
    const tradeNo = params.trade_no || "";
    const tradeStatus = params.trade_status || "";
    const totalAmount = params.total_amount || "";
    const passback = params.passback_params
      ? decodeURIComponent(params.passback_params)
      : "";

    if (passback) {
      const product = getProductById(passback);
      if (product && totalAmount) {
        const expected = product.price.toFixed(2);
        if (totalAmount !== expected) {
          await appendAlipayEvent("notify_amount_mismatch", {
            outTradeNo,
            totalAmount,
            expected,
            productId: passback,
          });
          return new NextResponse("failure", { status: 400 });
        }
      }
    }

    // Prefer authoritative query when possible (network may fail; notify remains source of record after sign).
    let query: Record<string, unknown> | null = null;
    try {
      if (outTradeNo || tradeNo) {
        query = await queryAlipayTrade({ outTradeNo, tradeNo });
      }
    } catch (error) {
      console.error("[aipay/notify] query failed", error);
    }

    await appendAlipayEvent("notify", {
      outTradeNo,
      tradeNo,
      tradeStatus,
      totalAmount,
      productId: passback || undefined,
      query,
    });

    // TRADE_SUCCESS / TRADE_FINISHED are paid states.
    if (
      tradeStatus === "TRADE_SUCCESS" ||
      tradeStatus === "TRADE_FINISHED" ||
      tradeStatus === "WAIT_BUYER_PAY"
    ) {
      return new NextResponse("success", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new NextResponse("success", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("[aipay/notify]", error);
    await appendAlipayEvent("notify_error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse("failure", { status: 500 });
  }
}
