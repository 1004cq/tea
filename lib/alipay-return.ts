/**
 * Decisions for the Alipay sync return page (GET /aipay).
 * Paid state and product confirmation require a verified signature.
 * The product id is taken from signed return params and/or the trade
 * query, and only when that order amount matches the catalog price.
 */

const PAID_TRADE_STATUSES = new Set(["TRADE_SUCCESS", "TRADE_FINISHED"]);

export function decodeAlipayPassback(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return "";
  }
}

/** Normalize a CNY yuan string to `whole.xx`, or null if it is not a 2-decimal amount. */
export function normalizeCnyAmount(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  return `${Number(whole)}.${frac.padEnd(2, "0")}`;
}

export function cnyAmountsEqual(
  actual: string | undefined,
  expected: string | undefined
): boolean {
  const left = normalizeCnyAmount(actual);
  const right = normalizeCnyAmount(expected);
  return left != null && right != null && left === right;
}

export function readAlipayString(
  record: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

/** Merchant trade.query is allowed only after the sync return signature verifies. */
export function canQueryAlipayReturn(
  verified: boolean,
  outTradeNo: string,
  tradeNo: string
): boolean {
  return verified && (outTradeNo.length > 0 || tradeNo.length > 0);
}

export type AlipayReturnAssessmentInput = {
  verified: boolean;
  tradeStatus?: string;
  signedPassback?: string;
  queryPassback?: string;
  queryAmount?: string;
  signedAmount?: string;
  /** Catalog price for the candidate product, as yuan. */
  catalogAmount?: string;
};

export type AlipayReturnAssessment = {
  paid: boolean;
  productId: string;
  amountMatches: boolean;
};

/**
 * Bind a catalog product to a return only when the signature is valid,
 * the trade is paid, signed and queried passback agree, and the paid
 * amount matches that product. Unsigned passback alone never confirms a purchase.
 */
export function assessAlipayReturn(
  input: AlipayReturnAssessmentInput
): AlipayReturnAssessment {
  if (!input.verified) {
    return { paid: false, productId: "", amountMatches: false };
  }

  const paid = PAID_TRADE_STATUSES.has(input.tradeStatus || "");
  const signedId = decodeAlipayPassback(input.signedPassback);
  const queryId = decodeAlipayPassback(input.queryPassback);
  if (signedId && queryId && signedId !== queryId) {
    return { paid, productId: "", amountMatches: false };
  }

  const productId = queryId || signedId;
  const queryAmount = normalizeCnyAmount(input.queryAmount);
  const signedAmount = normalizeCnyAmount(input.signedAmount);
  if (queryAmount && signedAmount && queryAmount !== signedAmount) {
    return { paid, productId: "", amountMatches: false };
  }

  const amount = queryAmount || signedAmount;
  const expected = normalizeCnyAmount(input.catalogAmount);
  const amountMatches = Boolean(
    productId && amount && expected && amount === expected
  );

  return {
    paid,
    productId: paid && amountMatches ? productId : "",
    amountMatches,
  };
}
