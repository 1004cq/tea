import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/lib/products";
import { createPayPalOrder, getPayPalCurrency } from "@/lib/paypal";

/**
 * POST /api/create-order
 * Body: { productId: string }
 * Creates a PayPal order using the catalog price (never trust client-sent amounts).
 */
export async function POST(request: NextRequest) {
  try {
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

    const currency = getPayPalCurrency();
    const order = await createPayPalOrder({
      productId: product.id,
      productName: `${product.name} (${product.nameEn})`,
      amount: product.price,
      currency,
    });

    return NextResponse.json({ orderID: order.id });
  } catch (error) {
    console.error("[create-order]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
