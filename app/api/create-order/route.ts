import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CheckoutError, createCatalogOrder, toClientError } from "@/lib/checkout-orders";

export const runtime = "nodejs";

/**
 * POST /api/create-order
 * Body: { productId: string }
 * Creates a PayPal order using the catalog price (never trust client-sent amounts)
 * and records the order id so capture can refuse anything this shop did not create.
 * When the buyer is signed in, the pending order is linked to their user id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const productId = readString(body, "productId");
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id || null;
    const result = await createCatalogOrder(productId, userId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError("create-order", error, "创建订单失败");
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new CheckoutError(400, "Invalid request", "invalid json");
  }
}

function readString(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function jsonError(scope: string, error: unknown, fallback: string) {
  const client = toClientError(error, fallback);
  if (client.status !== 400) {
    console.error(`[${scope}]`, client.log);
  }
  return NextResponse.json({ error: client.error }, { status: client.status });
}
