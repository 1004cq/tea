/**
 * Pure checks that a PayPal order still matches the catalog line this shop priced.
 * Reasons are stable codes for server logs. They must never include payer data.
 */

export type ExpectedShopOrder = {
  productId: string;
  amountCents: number;
  currency: string;
  customId: string;
};

export type OrderCheck =
  | { ok: true }
  | { ok: false; reason: string };

const PAYPAL_ORDER_ID = /^[0-9A-Z]{10,36}$/;
const PAYPAL_AMOUNT = /^(?:0|[1-9]\d{0,6})\.\d{2}$/;

export function isPayPalOrderId(value: string): boolean {
  return PAYPAL_ORDER_ID.test(value);
}

export function parsePayPalAmountToCents(value: unknown): number | null {
  if (typeof value !== "string" || !PAYPAL_AMOUNT.test(value)) return null;
  const [whole, frac] = value.split(".");
  const cents = Number(whole) * 100 + Number(frac);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function centsToPayPalValue(cents: number): string {
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const body = `${whole}.${String(frac).padStart(2, "0")}`;
  return cents < 0 ? `-${body}` : body;
}

/** Catalog prices must be positive amounts with at most two decimal places. */
export function priceToCents(price: number): number | null {
  if (!Number.isFinite(price) || price <= 0 || price > 9_999_999.99) return null;
  const formatted = price.toFixed(2);
  const cents = parsePayPalAmountToCents(formatted);
  if (cents == null || cents <= 0) return null;
  if (Math.abs(price - cents / 100) > 1e-8) return null;
  return cents;
}

function fail(reason: string): OrderCheck {
  return { ok: false, reason };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function moneyCents(money: unknown, currency: string): number | null {
  const record = asRecord(money);
  if (!record || record.currency_code !== currency) return null;
  return parsePayPalAmountToCents(record.value);
}

function isZeroMoney(money: unknown, currency: string): boolean {
  return moneyCents(money, currency) === 0;
}

const ZEROABLE_BREAKDOWN = new Set([
  "shipping",
  "handling",
  "tax_total",
  "insurance",
  "shipping_discount",
  "discount",
]);

function checkBreakdown(
  breakdown: unknown,
  expected: ExpectedShopOrder,
  itemTotalRequired: boolean
): string | null {
  const record = asRecord(breakdown);
  if (!record) return itemTotalRequired ? "item_total" : null;

  if (record.item_total !== undefined || itemTotalRequired) {
    if (moneyCents(record.item_total, expected.currency) !== expected.amountCents) {
      return "item_total";
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "item_total") continue;
    if (!ZEROABLE_BREAKDOWN.has(key) || !isZeroMoney(value, expected.currency)) {
      return "breakdown";
    }
  }

  return null;
}

function quantityIsOne(quantity: unknown): boolean {
  return quantity === "1" || quantity === 1;
}

function checkItems(
  items: unknown,
  expected: ExpectedShopOrder,
  required: boolean
): string | null {
  if (items === undefined) return required ? "item_count" : null;
  if (!Array.isArray(items) || items.length !== 1) return "item_count";

  const item = asRecord(items[0]);
  if (!item) return "item_count";
  if (item.sku !== expected.productId) return "item_sku";
  if (!quantityIsOne(item.quantity)) return "item_quantity";
  if (moneyCents(item.unit_amount, expected.currency) !== expected.amountCents) {
    return "item_amount";
  }
  return null;
}

function checkCapture(capture: unknown, expected: ExpectedShopOrder): string | null {
  const record = asRecord(capture);
  if (!record) return "capture_count";
  if (record.status !== "COMPLETED") return "capture_status";
  if (record.final_capture === false) return "capture_partial";
  if (moneyCents(record.amount, expected.currency) !== expected.amountCents) {
    return "capture_amount";
  }
  if (record.custom_id !== undefined && record.custom_id !== expected.customId) {
    return "custom_id";
  }
  return null;
}

function checkUnit(
  unit: unknown,
  expected: ExpectedShopOrder,
  phase: "recorded" | "captured"
): string | null {
  const record = asRecord(unit);
  if (!record) return "purchase_units";
  if (record.reference_id !== expected.productId) return "reference_id";

  const customRequired = phase === "recorded";
  if (record.custom_id !== expected.customId && (customRequired || record.custom_id !== undefined)) {
    return "custom_id";
  }

  const amountRequired = phase === "recorded";
  if (record.amount !== undefined || amountRequired) {
    if (moneyCents(record.amount, expected.currency) !== expected.amountCents) {
      return "amount";
    }
    const amount = asRecord(record.amount);
    const breakdown = amount?.breakdown;
    if (breakdown !== undefined || amountRequired) {
      const breakdownReason = checkBreakdown(breakdown, expected, amountRequired);
      if (breakdownReason) return breakdownReason;
    }
  }

  const itemReason = checkItems(record.items, expected, phase === "recorded");
  if (itemReason) return itemReason;

  if (phase === "captured") {
    const payments = asRecord(record.payments);
    const captures = payments?.captures;
    if (!Array.isArray(captures) || captures.length !== 1) return "capture_count";
    return checkCapture(captures[0], expected);
  }

  return null;
}

/**
 * `recorded` is the order we created or re-fetched before capture (line items required).
 * `captured` is the capture (or a completed order): the captured amount must match,
 * and line items / custom id must match when PayPal still returns them.
 */
export function checkPayPalOrderLinkage(
  order: unknown,
  expected: ExpectedShopOrder,
  phase: "recorded" | "captured"
): OrderCheck {
  const record = asRecord(order);
  if (!record) return fail("order_shape");
  if (record.intent !== undefined && record.intent !== "CAPTURE") return fail("intent");
  if (phase === "captured" && record.status !== "COMPLETED") return fail("order_status");

  if (!Array.isArray(record.purchase_units) || record.purchase_units.length !== 1) {
    return fail("purchase_units");
  }

  const reason = checkUnit(record.purchase_units[0], expected, phase);
  return reason ? fail(reason) : { ok: true };
}
