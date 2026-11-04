/**
 * Visibility flags for payment smoke-test SKUs.
 * When SHOW_*_TEST_SKU=true, SKUs appear in both live and sandbox.
 */

import { isAlipayConfigured } from "@/lib/alipay";

function envFlag(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function paypalCurrency(): string {
  return (
    process.env.PAYPAL_CURRENCY ||
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ||
    "USD"
  )
    .trim()
    .toUpperCase();
}

/** PayPal $0.01 test SKU — show when SHOW_TEST_SKU=true (live or sandbox). */
export function showPaypalTestSku(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  if (!envFlag("SHOW_TEST_SKU")) return false;
  return paypalCurrency() === "USD";
}

/** Alipay ¥0.01 test SKU — show when SHOW_ALIPAY_TEST_SKU=true and Alipay is ready. */
export function showAlipayTestSku(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return isAlipayConfigured();
  }
  if (!envFlag("SHOW_ALIPAY_TEST_SKU")) return false;
  if (!isAlipayConfigured()) return false;
  if (process.env.AIPAY_ENABLED?.trim().toLowerCase() === "false") return false;
  if (process.env.NEXT_PUBLIC_AIPAY_ENABLED?.trim().toLowerCase() === "false") {
    return false;
  }
  return true;
}
