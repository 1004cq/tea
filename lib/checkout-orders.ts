/**
 * Create and capture PayPal checkouts priced only from the server catalog.
 * Clients supply a product id or an order id this process previously issued.
 */

import { randomBytes } from "node:crypto";
import { getProductById } from "@/lib/products";
import {
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalCurrency,
  getPayPalOrder,
  type PayPalOrder,
} from "@/lib/paypal";
import {
  checkPayPalOrderLinkage,
  isPayPalOrderId,
  priceToCents,
  type ExpectedShopOrder,
} from "@/lib/paypal-order-guard";
import {
  getShopOrder,
  markShopOrderCaptured,
  saveShopOrder,
  type StoredShopOrder,
} from "@/lib/paypal-order-store";

export class CheckoutError extends Error {
  readonly httpStatus: number;
  readonly clientMessage: string;
  readonly logDetail: string;

  constructor(httpStatus: number, clientMessage: string, logDetail: string) {
    super(clientMessage);
    this.name = "CheckoutError";
    this.httpStatus = httpStatus;
    this.clientMessage = clientMessage;
    this.logDetail = logDetail;
  }
}

export function toClientError(
  error: unknown,
  fallback: string
): { status: number; error: string; log: string } {
  if (error instanceof CheckoutError) {
    return {
      status: error.httpStatus,
      error: error.clientMessage,
      log: error.logDetail,
    };
  }
  const log = error instanceof Error ? `${error.name}: ${error.message}` : "unknown error";
  return { status: 500, error: fallback, log };
}

function expectedFromRecord(record: StoredShopOrder): ExpectedShopOrder | null {
  const product = getProductById(record.productId);
  if (!product) return null;
  const catalogCents = priceToCents(product.price);
  const currency = getPayPalCurrency();
  if (catalogCents == null || catalogCents !== record.amountCents) return null;
  if (record.currency !== currency || !/^[A-Z]{3}$/.test(currency)) return null;
  return {
    productId: record.productId,
    amountCents: catalogCents,
    currency,
    customId: record.customId,
  };
}

async function acceptCapture(
  orderID: string,
  order: PayPalOrder,
  expected: ExpectedShopOrder
): Promise<{ status: "COMPLETED"; orderID: string }> {
  const captured = checkPayPalOrderLinkage(order, expected, "captured");
  if (!captured.ok) {
    throw new CheckoutError(409, "支付确认失败", `capture mismatch: ${captured.reason}`);
  }
  await markShopOrderCaptured(orderID);
  console.info("[capture-order]", {
    orderID,
    productId: expected.productId,
    status: "COMPLETED",
  });
  return { status: "COMPLETED", orderID };
}

export async function createCatalogOrder(productId: string): Promise<{ orderID: string }> {
  const id = productId.trim();
  if (!id) {
    throw new CheckoutError(400, "productId is required", "missing productId");
  }

  const product = getProductById(id);
  if (!product) {
    throw new CheckoutError(404, "Product not found", "unknown product");
  }

  const amountCents = priceToCents(product.price);
  const currency = getPayPalCurrency();
  if (amountCents == null || !/^[A-Z]{3}$/.test(currency)) {
    throw new CheckoutError(500, "创建订单失败", "invalid catalog price or currency");
  }

  const customId = randomBytes(16).toString("hex");
  const expected: ExpectedShopOrder = {
    productId: product.id,
    amountCents,
    currency,
    customId,
  };

  let order: PayPalOrder;
  try {
    order = await createPayPalOrder({
      productId: product.id,
      productName: `${product.name} (${product.nameEn})`,
      amountCents,
      currency,
      customId,
    });
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    console.error(
      "[create-order] paypal create failed",
      error instanceof Error ? error.message : "unknown error"
    );
    throw new CheckoutError(500, "创建订单失败", "paypal create failed");
  }

  if (!order || typeof order !== "object" || typeof order.id !== "string") {
    throw new CheckoutError(500, "创建订单失败", "paypal returned no order id");
  }

  if (!isPayPalOrderId(order.id)) {
    throw new CheckoutError(500, "创建订单失败", "paypal returned an unexpected order id");
  }

  const linkage = checkPayPalOrderLinkage(order, expected, "recorded");
  if (!linkage.ok) {
    throw new CheckoutError(500, "创建订单失败", `created order mismatch: ${linkage.reason}`);
  }

  await saveShopOrder({
    orderId: order.id,
    productId: product.id,
    amountCents,
    currency,
    customId,
    createdAt: new Date().toISOString(),
    status: "pending",
  });

  console.info("[create-order]", { orderID: order.id, productId: product.id });
  return { orderID: order.id };
}

export async function captureCatalogOrder(
  orderID: string
): Promise<{ status: "COMPLETED"; orderID: string }> {
  const id = orderID.trim();
  if (!id) {
    throw new CheckoutError(400, "orderID is required", "missing orderID");
  }

  if (!isPayPalOrderId(id)) {
    throw new CheckoutError(400, "Invalid order ID", "invalid orderID");
  }

  const record = await getShopOrder(id);
  if (!record) {
    throw new CheckoutError(404, "Order not found", `unknown order ${id}`);
  }

  const expected = expectedFromRecord(record);
  if (!expected) {
    throw new CheckoutError(
      409,
      "支付确认失败",
      `catalog mismatch product=${record.productId} cents=${record.amountCents} currency=${record.currency}`
    );
  }

  if (record.status === "captured") {
    return { status: "COMPLETED", orderID: id };
  }

  const remote = await getPayPalOrder(id);
  const remoteStatus = typeof remote.status === "string" ? remote.status : "";

  if (remoteStatus === "COMPLETED") {
    return acceptCapture(id, remote, expected);
  }

  const recorded = checkPayPalOrderLinkage(remote, expected, "recorded");
  if (!recorded.ok) {
    throw new CheckoutError(409, "支付确认失败", `order mismatch: ${recorded.reason}`);
  }

  if (remoteStatus !== "APPROVED") {
    throw new CheckoutError(402, "支付未完成", `not approved: ${remoteStatus || "unknown"}`);
  }

  try {
    const capture = await capturePayPalOrder(id);
    return await acceptCapture(id, capture, expected);
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    console.error(
      "[capture-order] capture request failed",
      error instanceof Error ? error.message : "unknown error"
    );
    try {
      const reread = await getPayPalOrder(id);
      if (reread.status === "COMPLETED") {
        return await acceptCapture(id, reread, expected);
      }
    } catch (rereadError) {
      if (rereadError instanceof CheckoutError) throw rereadError;
      console.error(
        "[capture-order] reread failed",
        rereadError instanceof Error ? rereadError.message : "unknown error"
      );
    }
    throw new CheckoutError(500, "支付确认失败", "capture failed");
  }
}
