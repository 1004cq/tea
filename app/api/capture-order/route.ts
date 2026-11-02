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
    const status =
      typeof capture.status === "string" ? capture.status : "UNKNOWN";

    // Prefer capture unit status when present
    const units = Array.isArray(capture.purchase_units)
      ? capture.purchase_units
      : [];
    const captures = units.flatMap((unit) => {
      if (!unit || typeof unit !== "object") return [];
      const payments = (unit as { payments?: { captures?: unknown } }).payments;
      return Array.isArray(payments?.captures) ? payments.captures : [];
    }) as Array<{ id?: string; status?: string; amount?: unknown }>;

    const captureStatuses = captures.map((c) => c.status || "UNKNOWN");
    console.info("[capture-order]", {
      orderID,
      orderStatus: status,
      captureStatuses,
      captureIds: captures.map((c) => c.id).filter(Boolean),
    });

    if (status !== "COMPLETED" && !captureStatuses.includes("COMPLETED")) {
      return NextResponse.json(
        {
          error: `支付未完成（状态：${status}）`,
          capture,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({ capture, status });
  } catch (error) {
    console.error("[capture-order]", error);
    const message =
      error instanceof Error ? error.message : "Failed to capture PayPal order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
