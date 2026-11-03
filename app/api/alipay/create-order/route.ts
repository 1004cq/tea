import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import {
  appendAlipayEvent,
  createAlipayPagePayUrl,
  createOutTradeNo,
  formatCnyAmount,
  isAlipayConfigured,
} from "@/lib/alipay";

/**
 * POST /api/alipay/create-order
 * Body: { productId: string }
 * Creates an Alipay page-pay redirect URL using catalog CNY amount.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAlipayConfigured()) {
      return NextResponse.json(
        { error: "Alipay is not configured on the server" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { productId?: string };
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

    const outTradeNo = createOutTradeNo(product.id);
    const totalAmount = formatCnyAmount(product.price);
    const subject = `${product.name} ${product.nameEn}`.trim();

    const payUrl = createAlipayPagePayUrl({
      outTradeNo,
      subject,
      totalAmount,
      body: product.description,
      productId: product.id,
    });

    await appendAlipayEvent("create_order", {
      outTradeNo,
      productId: product.id,
      totalAmount,
      currency: "CNY",
    });

    return NextResponse.json({
      outTradeNo,
      payUrl,
      amount: totalAmount,
      currency: "CNY",
    });
  } catch (error) {
    console.error("[alipay/create-order]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create Alipay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
