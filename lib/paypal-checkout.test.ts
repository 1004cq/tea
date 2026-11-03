import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST as captureOrder } from "../app/api/capture-order/route";
import { POST as createOrder } from "../app/api/create-order/route";
import { CheckoutError, captureCatalogOrder, toClientError } from "./checkout-orders";
import {
  centsToPayPalValue,
  checkPayPalOrderLinkage,
  isPayPalOrderId,
  parsePayPalAmountToCents,
  priceToCents,
  type ExpectedShopOrder,
} from "./paypal-order-guard";
import {
  getShopOrder,
  resetShopOrderStoreForTests,
  saveShopOrder,
} from "./paypal-order-store";

type CreatedPurchaseUnit = {
  reference_id: string;
  custom_id: string;
  amount: { value: string; breakdown: { item_total: { value: string } } };
  items: Array<{ sku: string; quantity: string; unit_amount: { value: string } }>;
};

const expected: ExpectedShopOrder = {
  productId: "dianhong-classic",
  amountCents: 2800,
  currency: "USD",
  customId: "a".repeat(32),
};

function money(value: string) {
  return { currency_code: "USD", value };
}

function recordedOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "5O190127TN364715T",
    status: "APPROVED",
    intent: "CAPTURE",
    payer: { email_address: "buyer@example.com", payer_id: "SECRET" },
    purchase_units: [
      {
        reference_id: expected.productId,
        custom_id: expected.customId,
        amount: {
          ...money("28.00"),
          breakdown: { item_total: money("28.00") },
        },
        items: [
          {
            name: "经典滇红 (Classic Dianhong)",
            sku: expected.productId,
            quantity: "1",
            unit_amount: money("28.00"),
          },
        ],
        ...overrides,
      },
    ],
  };
}

test("catalog cents and PayPal order ids", () => {
  assert.equal(priceToCents(28), 2800);
  assert.equal(priceToCents(0.01), 1);
  assert.equal(priceToCents(28.001), null);
  assert.equal(parsePayPalAmountToCents("28.00"), 2800);
  assert.equal(parsePayPalAmountToCents("0.01"), 1);
  assert.equal(parsePayPalAmountToCents("28"), null);
  assert.equal(parsePayPalAmountToCents("01.00"), null);
  assert.equal(centsToPayPalValue(2800), "28.00");
  assert.equal(centsToPayPalValue(1), "0.01");
  assert.equal(isPayPalOrderId("5O190127TN364715T"), true);
  assert.equal(isPayPalOrderId("../etc/passwd"), false);
  assert.equal(isPayPalOrderId("5O190127TN364715T/capture"), false);
  assert.equal(isPayPalOrderId("lowercaseid12"), false);
});

test("recorded orders must match catalog amount, sku, and custom id", () => {
  assert.deepEqual(checkPayPalOrderLinkage(recordedOrder(), expected, "recorded"), {
    ok: true,
  });

  const cases: Array<[Record<string, unknown>, string]> = [
    [{ amount: { ...money("1.00"), breakdown: { item_total: money("1.00") } }, items: [{ sku: expected.productId, quantity: "1", unit_amount: money("1.00") }] }, "amount"],
    [{ custom_id: "b".repeat(32) }, "custom_id"],
    [{ reference_id: "gift-set" }, "reference_id"],
    [{ items: [{ sku: "gift-set", quantity: "1", unit_amount: money("28.00") }] }, "item_sku"],
    [{ items: [{ sku: expected.productId, quantity: "2", unit_amount: money("28.00") }] }, "item_quantity"],
    [{ items: [] }, "item_count"],
    [{
      amount: {
        ...money("28.00"),
        breakdown: { item_total: money("28.00"), discount: money("27.99") },
      },
    }, "breakdown"],
  ];

  for (const [overrides, reason] of cases) {
    const result = checkPayPalOrderLinkage(recordedOrder(overrides), expected, "recorded");
    assert.deepEqual(result, { ok: false, reason });
    assert.equal(JSON.stringify(result).includes("buyer@example.com"), false);
  }

  const twoUnits = recordedOrder();
  twoUnits.purchase_units.push(twoUnits.purchase_units[0]);
  assert.equal(checkPayPalOrderLinkage(twoUnits, expected, "recorded").ok, false);
});

test("captured amount must match even when payer and line items are omitted", () => {
  const captured = {
    id: "5O190127TN364715T",
    status: "COMPLETED",
    intent: "CAPTURE",
    payer: { email_address: "buyer@example.com", name: { given_name: "Ada" } },
    payment_source: { paypal: { email_address: "buyer@example.com" } },
    purchase_units: [
      {
        reference_id: expected.productId,
        payments: {
          captures: [
            {
              id: "CAPTUREID1234567",
              status: "COMPLETED",
              amount: money("28.00"),
              final_capture: true,
            },
          ],
        },
      },
    ],
  };
  assert.deepEqual(checkPayPalOrderLinkage(captured, expected, "captured"), { ok: true });

  const cheap = structuredClone(captured);
  (cheap.purchase_units[0].payments.captures[0].amount as { value: string }).value = "0.01";
  const mismatch = checkPayPalOrderLinkage(cheap, expected, "captured");
  assert.deepEqual(mismatch, { ok: false, reason: "capture_amount" });
  assert.equal(JSON.stringify(mismatch).includes("buyer@example.com"), false);

  const extraItem = structuredClone(captured);
  (extraItem.purchase_units[0] as { items?: unknown }).items = [
    { sku: "gift-set", quantity: "1", unit_amount: money("28.00") },
  ];
  assert.equal(
    checkPayPalOrderLinkage(extraItem, expected, "captured").ok,
    false
  );
});

test("client errors never forward upstream messages", () => {
  const upstream = new Error(
    'PayPal capture failed (422): {"debug_id":"dbg123","message":"buyer@example.com"}'
  );
  const safe = toClientError(upstream, "支付确认失败");
  assert.equal(safe.error, "支付确认失败");
  assert.equal(safe.status, 500);
  assert.equal(safe.error.includes("debug_id"), false);
  assert.equal(safe.error.includes("buyer@example.com"), false);

  const checkout = toClientError(
    new CheckoutError(409, "支付确认失败", "order mismatch: amount"),
    "支付确认失败"
  );
  assert.equal(checkout.status, 409);
  assert.equal(checkout.error, "支付确认失败");
  assert.equal(checkout.log, "order mismatch: amount");
  assert.equal(checkout.error.includes("amount"), false);
});

test("capture only shop-created orders and hide PayPal error bodies", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "tea-paypal-"));
  const storeFile = path.join(directory, "orders.json");
  const previous = {
    store: process.env.PAYPAL_ORDER_STORE_FILE,
    currency: process.env.NEXT_PUBLIC_PAYPAL_CURRENCY,
    client: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_CLIENT_SECRET,
    fetch: globalThis.fetch,
  };
  process.env.PAYPAL_ORDER_STORE_FILE = storeFile;
  process.env.NEXT_PUBLIC_PAYPAL_CURRENCY = "USD";
  process.env.PAYPAL_CLIENT_ID = "test-client";
  process.env.PAYPAL_CLIENT_SECRET = "test-secret";
  resetShopOrderStoreForTests();

  const calls: string[] = [];
  const logs: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    logs.push(
      args
        .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
        .join(" ")
    );
  };

  let sequence = 0;
  let createdId = "";
  let lastCreate: { purchase_units: CreatedPurchaseUnit[] } | null = null;
  function currentCreate(): { purchase_units: CreatedPurchaseUnit[] } {
    if (lastCreate == null) throw new Error("create payload was not recorded");
    return lastCreate;
  }
  let mode: "ok" | "mismatch" | "paypal-error" | "recover" = "ok";
  let failCreate = false;
  let gets = 0;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    calls.push(`${method} ${new URL(url).pathname}`);

    if (url.includes("/v1/oauth2/token")) {
      return Response.json({ access_token: "test-token" });
    }

    if (method === "POST" && new URL(url).pathname.endsWith("/v2/checkout/orders")) {
      if (failCreate) {
        return Response.json(
          { name: "INTERNAL_SERVER_ERROR", debug_id: "dbg-create", message: "buyer@example.com" },
          { status: 500 }
        );
      }
      const body = JSON.parse(String(init?.body)) as { purchase_units: CreatedPurchaseUnit[] };
      lastCreate = body;
      const orderId = `ORDER${String(++sequence).padStart(12, "0")}`;
      return Response.json({
        id: orderId,
        status: "CREATED",
        intent: "CAPTURE",
        purchase_units: body.purchase_units,
      });
    }

    if (method === "GET" && /\/v2\/checkout\/orders\/[0-9A-Z]+$/.test(new URL(url).pathname)) {
      gets += 1;
      const record = await getShopOrder(createdId);
      assert.ok(record);
      const value = mode === "mismatch" ? "1.00" : centsToPayPalValue(record.amountCents);
      const status = mode === "recover" && gets > 1 ? "COMPLETED" : mode === "recover" ? "APPROVED" : "APPROVED";
      const unit: Record<string, unknown> = {
        reference_id: record.productId,
        custom_id: record.customId,
        amount: {
          currency_code: record.currency,
          value,
          breakdown: { item_total: { currency_code: record.currency, value } },
        },
        items: [
          {
            name: "item",
            sku: record.productId,
            quantity: "1",
            unit_amount: { currency_code: record.currency, value },
          },
        ],
      };
      if (status === "COMPLETED") {
        unit.payments = {
          captures: [
            {
              id: "CAPTUREID1234567",
              status: "COMPLETED",
              amount: { currency_code: record.currency, value: centsToPayPalValue(record.amountCents) },
              final_capture: true,
            },
          ],
        };
      }
      return Response.json({
        id: record.orderId,
        status,
        intent: "CAPTURE",
        payer: { email_address: "buyer@example.com", payer_id: "PAYER" },
        purchase_units: [unit],
      });
    }

    if (method === "POST" && url.includes("/capture")) {
      if (mode === "paypal-error" || mode === "recover") {
        return Response.json(
          {
            name: "UNPROCESSABLE_ENTITY",
            debug_id: "dbg-should-not-leak",
            message: "payer buyer@example.com",
            payer: { email_address: "buyer@example.com" },
          },
          { status: 422 }
        );
      }
      const record = await getShopOrder(createdId);
      assert.ok(record);
      return Response.json({
        id: record.orderId,
        status: "COMPLETED",
        intent: "CAPTURE",
        payer: {
          email_address: "buyer@example.com",
          name: { given_name: "Ada", surname: "Lovelace" },
        },
        purchase_units: [
          {
            reference_id: record.productId,
            payments: {
              captures: [
                {
                  id: "CAPTUREID1234567",
                  status: "COMPLETED",
                  amount: {
                    currency_code: record.currency,
                    value: centsToPayPalValue(record.amountCents),
                  },
                  final_capture: true,
                },
              ],
            },
          },
        ],
      });
    }

    throw new Error(`unexpected fetch ${method} ${url}`);
  }) as typeof fetch;

  try {
    const created = await post(createOrder, { productId: "dianhong-classic" });
    assert.equal(created.status, 200);
    const createdBody = (await created.json()) as { orderID: string };
    assert.deepEqual(Object.keys(createdBody), ["orderID"]);
    createdId = createdBody.orderID;
    assert.equal(isPayPalOrderId(createdId), true);
    const classicOrder = currentCreate();
    assert.equal(classicOrder.purchase_units[0]?.reference_id, "dianhong-classic");
    assert.equal(classicOrder.purchase_units[0]?.amount.value, "28.00");
    assert.equal(classicOrder.purchase_units[0]?.amount.breakdown.item_total.value, "28.00");
    assert.equal(classicOrder.purchase_units[0]?.items[0]?.sku, "dianhong-classic");
    assert.equal(classicOrder.purchase_units[0]?.items[0]?.quantity, "1");
    assert.equal(classicOrder.purchase_units[0]?.items[0]?.unit_amount.value, "28.00");
    assert.match(classicOrder.purchase_units[0]?.custom_id ?? "", /^[a-f0-9]{32}$/);

    const cent = await post(createOrder, { productId: "paypal-test-cent" });
    assert.equal(cent.status, 200);
    const centOrder = currentCreate();
    assert.equal(centOrder.purchase_units[0]?.amount.value, "0.01");
    assert.equal(centOrder.purchase_units[0]?.items[0]?.unit_amount.value, "0.01");

    calls.length = 0;
    const unknown = await post(captureOrder, { orderID: "UNKNOWNORDER1234" });
    assert.equal(unknown.status, 404);
    assert.deepEqual(await unknown.json(), { error: "Order not found" });
    assert.equal(calls.length, 0);

    const injected = await post(captureOrder, { orderID: "../etc/passwd" });
    assert.equal(injected.status, 400);
    assert.deepEqual(await injected.json(), { error: "Invalid order ID" });
    assert.equal(calls.length, 0);

    await saveShopOrder({
      orderId: "DRIFTORDERID1234",
      productId: "dianhong-classic",
      amountCents: 1,
      currency: "USD",
      customId: "c".repeat(32),
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    const drifted = await post(captureOrder, { orderID: "DRIFTORDERID1234" });
    assert.equal(drifted.status, 409);
    assert.equal(JSON.stringify(await drifted.json()).includes("0.01"), false);
    assert.equal(calls.length, 0);

    mode = "mismatch";
    gets = 0;
    const mismatched = await post(captureOrder, { orderID: createdId });
    assert.equal(mismatched.status, 409);
    assert.deepEqual(await mismatched.json(), { error: "支付确认失败" });
    assert.equal(calls.some((call) => call.includes("/capture")), false);

    mode = "ok";
    gets = 0;
    calls.length = 0;
    const paid = await post(captureOrder, { orderID: createdId });
    const paidText = await paid.text();
    assert.equal(paid.status, 200);
    assert.deepEqual(JSON.parse(paidText), { status: "COMPLETED", orderID: createdId });
    assert.equal(paidText.includes("buyer@example.com"), false);
    assert.equal(paidText.includes("payer"), false);
    assert.equal(paidText.includes("Ada"), false);
    assert.equal(calls.some((call) => call.endsWith("/capture")), true);

    calls.length = 0;
    const replay = await captureCatalogOrder(createdId);
    assert.deepEqual(replay, { status: "COMPLETED", orderID: createdId });
    assert.equal(calls.length, 0);

    resetShopOrderStoreForTests();
    const reloaded = await getShopOrder(createdId);
    assert.equal(reloaded?.status, "captured");
    assert.equal(JSON.stringify(reloaded).includes("buyer@example.com"), false);

    resetShopOrderStoreForTests();
    const freshCreate = await post(createOrder, { productId: "golden-needle" });
    assert.equal(freshCreate.status, 200);
    createdId = ((await freshCreate.json()) as { orderID: string }).orderID;
    mode = "paypal-error";
    logs.length = 0;
    const leaked = await post(captureOrder, { orderID: createdId });
    const leakedText = await leaked.text();
    assert.equal(leaked.status, 500);
    assert.equal(leakedText.includes("dbg-should-not-leak"), false);
    assert.equal(leakedText.includes("buyer@example.com"), false);
    assert.equal(leakedText.includes("UNPROCESSABLE_ENTITY"), false);
    assert.equal(logs.some((line) => line.includes("dbg-should-not-leak")), true);
    assert.equal(logs.some((line) => line.includes("buyer@example.com")), false);

    mode = "recover";
    gets = 0;
    logs.length = 0;
    calls.length = 0;
    const recovered = await post(captureOrder, { orderID: createdId });
    const recoveredText = await recovered.text();
    assert.equal(recovered.status, 200, recoveredText);
    assert.deepEqual(JSON.parse(recoveredText), {
      status: "COMPLETED",
      orderID: createdId,
    });
    assert.equal(recoveredText.includes("dbg-should-not-leak"), false);

    calls.length = 0;
    const missingProduct = await post(createOrder, { productId: "not-a-tea" });
    assert.equal(missingProduct.status, 404);
    assert.deepEqual(await missingProduct.json(), { error: "Product not found" });
    assert.equal(calls.length, 0);

    failCreate = true;
    logs.length = 0;
    const failedCreate = await post(createOrder, { productId: "aged-dianhong" });
    const failedCreateText = await failedCreate.text();
    assert.equal(failedCreate.status, 500);
    assert.equal(failedCreateText.includes("dbg-create"), false);
    assert.equal(failedCreateText.includes("buyer@example.com"), false);
    assert.equal(logs.some((line) => line.includes("dbg-create")), true);
    assert.equal(logs.some((line) => line.includes("buyer@example.com")), false);
  } finally {
    console.error = originalError;
    globalThis.fetch = previous.fetch;
    if (previous.store === undefined) delete process.env.PAYPAL_ORDER_STORE_FILE;
    else process.env.PAYPAL_ORDER_STORE_FILE = previous.store;
    if (previous.currency === undefined) delete process.env.NEXT_PUBLIC_PAYPAL_CURRENCY;
    else process.env.NEXT_PUBLIC_PAYPAL_CURRENCY = previous.currency;
    if (previous.client === undefined) delete process.env.PAYPAL_CLIENT_ID;
    else process.env.PAYPAL_CLIENT_ID = previous.client;
    if (previous.secret === undefined) delete process.env.PAYPAL_CLIENT_SECRET;
    else process.env.PAYPAL_CLIENT_SECRET = previous.secret;
    resetShopOrderStoreForTests();
    await rm(directory, { recursive: true, force: true });
  }
});

async function post(
  handler: (request: NextRequest) => Promise<Response>,
  body: unknown
): Promise<Response> {
  return handler(
    new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}
