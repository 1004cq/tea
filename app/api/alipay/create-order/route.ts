import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import {
  createAlipayPayUrl,
  createOutTradeNo,
  formatCnyAmount,
  isAlipayConfigured,
  resolveAlipayPayChannel,
  tryAppendAlipayEvent,
} from "@/lib/alipay";

/**
 * POST /api/alipay/create-order
 * Body: { productId: string, channel?: "page" | "wap" | "auto" }
 * Creates an Alipay redirect URL:
 * - page → alipay.trade.page.pay (电脑网站支付)
 * - wap  → alipay.trade.wap.pay  (手机网站支付)
 * Auto uses the request User-Agent when channel is omitted / "auto".
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAlipayConfigured()) {
      return NextResponse.json(
        { error: "Alipay is not configured on the server" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      productId?: string;
      channel?: string;
    };
    const productId = body.productId?.trim();

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const channel = resolveAlipayPayChannel({
      requested: body.channel,
      userAgent: request.headers.get("user-agent"),
    });

    const outTradeNo = createOutTradeNo(product.id);
    const totalAmount = formatCnyAmount(product.priceCny);
    const subject = `${product.name} ${product.nameEn}`.trim();

    const payUrl = createAlipayPayUrl({
      outTradeNo,
      subject,
      totalAmount,
      body: product.description,
      productId: product.id,
      channel,
    });

    await tryAppendAlipayEvent("create_order", {
      outTradeNo,
      productId: product.id,
      totalAmount,
      currency: "CNY",
      channel,
      method:
        channel === "wap" ? "alipay.trade.wap.pay" : "alipay.trade.page.pay",
    });

    return NextResponse.json({
      outTradeNo,
      payUrl,
      amount: totalAmount,
      currency: "CNY",
      channel,
    });
  } catch (error) {
    console.error("[alipay/create-order]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create Alipay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
