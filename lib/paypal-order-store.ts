/**
 * Orders this shop created. Capture refuses any PayPal order id that is not here.
 * One Node process (the VPS app) owns the file; writes are serialized in-process.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { isPayPalOrderId } from "@/lib/paypal-order-guard";

export type StoredShopOrder = {
  orderId: string;
  productId: string;
  amountCents: number;
  currency: string;
  customId: string;
  createdAt: string;
  status: "pending" | "captured";
  capturedAt?: string;
};

const memory = new Map<string, StoredShopOrder>();
let loaded = false;
let queue: Promise<unknown> = Promise.resolve();

function storePath(): string {
  const override = process.env.PAYPAL_ORDER_STORE_FILE?.trim();
  if (override) return override;
  return path.join(process.cwd(), "data", "paypal-orders.json");
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isStoredOrder(value: unknown): value is StoredShopOrder {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const order = value as Record<string, unknown>;
  if (typeof order.orderId !== "string" || !isPayPalOrderId(order.orderId)) return false;
  if (typeof order.productId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(order.productId)) {
    return false;
  }
  if (
    typeof order.amountCents !== "number" ||
    !Number.isSafeInteger(order.amountCents) ||
    order.amountCents <= 0 ||
    order.amountCents > 999_999_999
  ) {
    return false;
  }
  if (typeof order.currency !== "string" || !/^[A-Z]{3}$/.test(order.currency)) return false;
  if (typeof order.customId !== "string" || !/^[a-f0-9]{32}$/.test(order.customId)) return false;
  if (typeof order.createdAt !== "string" || order.createdAt.length < 10 || order.createdAt.length > 40) {
    return false;
  }
  if (order.status !== "pending" && order.status !== "captured") return false;
  if (order.capturedAt !== undefined) {
    if (typeof order.capturedAt !== "string" || order.capturedAt.length > 40) return false;
  }
  return true;
}

async function loadFromDisk(): Promise<void> {
  memory.clear();
  let raw: string;
  try {
    raw = await readFile(storePath(), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  const parsed = JSON.parse(raw) as unknown;
  const orders = asOrderList(parsed);
  let skipped = 0;
  for (const entry of orders) {
    if (!isStoredOrder(entry)) {
      skipped += 1;
      continue;
    }
    memory.set(entry.orderId, entry);
  }
  if (skipped > 0) {
    console.error("[paypal-order-store] skipped invalid records", { skipped });
  }
}

function asOrderList(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { orders?: unknown }).orders)) {
    return (parsed as { orders: unknown[] }).orders;
  }
  throw new Error("PayPal order store is corrupt");
}

async function persist(): Promise<void> {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  const body = JSON.stringify({ orders: [...memory.values()] });
  await writeFile(tmp, body, { encoding: "utf8", mode: 0o600 });
  await rename(tmp, file);
}

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  await loadFromDisk();
  loaded = true;
}

export function saveShopOrder(order: StoredShopOrder): Promise<void> {
  return enqueue(async () => {
    await ensureLoaded();
    if (!isStoredOrder(order)) {
      throw new Error("Refusing to record an invalid shop order");
    }
    if (memory.has(order.orderId)) {
      throw new Error("Order already recorded");
    }
    memory.set(order.orderId, { ...order });
    try {
      await persist();
    } catch (error) {
      memory.delete(order.orderId);
      throw error;
    }
  });
}

export function getShopOrder(orderId: string): Promise<StoredShopOrder | null> {
  return enqueue(async () => {
    await ensureLoaded();
    const found = memory.get(orderId);
    return found ? { ...found } : null;
  });
}

export function markShopOrderCaptured(orderId: string): Promise<void> {
  return enqueue(async () => {
    await ensureLoaded();
    const current = memory.get(orderId);
    if (!current) throw new Error("Order not recorded");
    if (current.status === "captured") return;
    const next: StoredShopOrder = {
      ...current,
      status: "captured",
      capturedAt: new Date().toISOString(),
    };
    memory.set(orderId, next);
    try {
      await persist();
    } catch (error) {
      memory.set(orderId, current);
      throw error;
    }
  });
}

/** Clears the in-process cache so tests can point at a fresh file. */
export function resetShopOrderStoreForTests(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Order store reset is test-only");
  }
  memory.clear();
  loaded = false;
  queue = Promise.resolve();
}
