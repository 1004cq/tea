import { NextResponse } from "next/server";

/**
 * GET /api/paypal-config
 * Public client ID + currency for the PayPal JS SDK (secret never returned).
 */
export async function GET() {
  const clientId = (
    process.env.PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    ""
  ).trim();
  const currency = (
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ||
    process.env.PAYPAL_CURRENCY ||
    "USD"
  )
    .trim()
    .toUpperCase();

  return NextResponse.json({
    clientId: clientId || null,
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
    mode: process.env.PAYPAL_MODE === "live" ? "live" : "sandbox",
  });
}
