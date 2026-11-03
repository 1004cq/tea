import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CheckoutError, captureCatalogOrder, toClientError } from "@/lib/checkout-orders";

export const runtime = "nodejs";

/**
 * POST /api/capture-order
 * Body: { orderID: string }
 * Captures a PayPal order only when this shop created it and the approved
 * amount and line items still match the catalog price recorded for it.
 * On success, persists a PAID order row (linked to the signed-in user when present).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const orderID = readString(body, "orderID");
    if (!orderID) {
      return NextResponse.json({ error: "orderID is required" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id || null;
    const result = await captureCatalogOrder(orderID, userId);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError("capture-order", error, "支付确认失败");
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
