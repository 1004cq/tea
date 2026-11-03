import { OrderStatus, type Order } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getProductById } from "@/lib/products";

export type CreatePendingOrderInput = {
  paypalOrderId: string;
  productId: string;
  productName: string;
  amountCents: number;
  currency: string;
  customId?: string;
  userId?: string | null;
};

export async function createPendingOrder(
  input: CreatePendingOrderInput
): Promise<Order> {
  const existing = await prisma.order.findUnique({
    where: { paypalOrderId: input.paypalOrderId },
  });
  if (existing) {
    if (existing.status === OrderStatus.PAID) return existing;
    return prisma.order.update({
      where: { paypalOrderId: input.paypalOrderId },
      data: {
        productId: input.productId,
        productName: input.productName,
        amountCents: input.amountCents,
        currency: input.currency,
        customId: input.customId,
        ...(input.userId && !existing.userId ? { userId: input.userId } : {}),
      },
    });
  }

  return prisma.order.create({
    data: {
      paypalOrderId: input.paypalOrderId,
      productId: input.productId,
      productName: input.productName,
      amountCents: input.amountCents,
      currency: input.currency,
      customId: input.customId,
      userId: input.userId || null,
      status: OrderStatus.PENDING,
    },
  });
}

export async function markOrderPaidByPayPalId(
  paypalOrderId: string,
  opts?: { paidAt?: Date; userId?: string | null }
): Promise<Order | null> {
  const existing = await prisma.order.findUnique({
    where: { paypalOrderId },
  });
  if (!existing) return null;
  if (existing.status === OrderStatus.PAID) {
    if (opts?.userId && !existing.userId) {
      return prisma.order.update({
        where: { paypalOrderId },
        data: { userId: opts.userId },
      });
    }
    return existing;
  }

  return prisma.order.update({
    where: { paypalOrderId },
    data: {
      status: OrderStatus.PAID,
      paidAt: opts?.paidAt ?? new Date(),
      ...(opts?.userId && !existing.userId ? { userId: opts.userId } : {}),
    },
  });
}

/** Ensure a paid order row exists even if create-order never wrote Prisma (webhook-only). */
export async function upsertPaidOrderFromPayPal(input: {
  paypalOrderId: string;
  productId?: string | null;
  productName?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  paidAt?: Date;
  userId?: string | null;
}): Promise<Order> {
  const product = input.productId ? getProductById(input.productId) : undefined;
  const productId = input.productId || product?.id || "unknown";
  const productName =
    input.productName ||
    (product ? `${product.name} (${product.nameEn})` : productId);
  const amountCents =
    input.amountCents ??
    (product ? Math.round(product.price * 100) : 0);
  const currency = (input.currency || "USD").toUpperCase();

  return prisma.order.upsert({
    where: { paypalOrderId: input.paypalOrderId },
    create: {
      paypalOrderId: input.paypalOrderId,
      productId,
      productName,
      amountCents,
      currency,
      userId: input.userId || null,
      status: OrderStatus.PAID,
      paidAt: input.paidAt ?? new Date(),
    },
    update: {
      status: OrderStatus.PAID,
      paidAt: input.paidAt ?? new Date(),
      ...(input.userId
        ? { userId: input.userId }
        : {}),
      ...(input.productId ? { productId: input.productId } : {}),
      ...(input.productName ? { productName: input.productName } : {}),
      ...(input.amountCents != null ? { amountCents: input.amountCents } : {}),
      ...(input.currency ? { currency } : {}),
    },
  });
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  return prisma.order.findMany({
    where: { userId },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });
}

export function formatOrderAmount(order: Order): string {
  return `${order.currency} ${(order.amountCents / 100).toFixed(2)}`;
}

export function orderStatusLabel(status: OrderStatus): { zh: string; en: string } {
  switch (status) {
    case OrderStatus.PAID:
      return { zh: "已支付", en: "Paid" };
    case OrderStatus.FAILED:
      return { zh: "失败", en: "Failed" };
    default:
      return { zh: "待支付", en: "Pending" };
  }
}
