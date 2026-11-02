import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";

/**
 * POST /api/capture-order
 * Body: { orderID: string }
 * Captures payment after the buyer approves in PayPal.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { orderID?: string };
    const orderID = body.orderID?.trim();

    if (!orderID) {
      return NextResponse.json(
        { error: "orderID is required" },
        { status: 400 }
      );
    }

    const capture = await capturePayPalOrder(orderID);
    return NextResponse.json({ capture });
  } catch (error) {
    console.error("[capture-order]", error);
    const message =
      error instanceof Error ? error.message : "Failed to capture PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
