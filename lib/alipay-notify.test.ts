import assert from "node:assert/strict";
import test from "node:test";
import { handleAlipayNotify, type AlipayNotifyDeps } from "./alipay-notify";

function deps(
  overrides: Partial<AlipayNotifyDeps> = {}
): AlipayNotifyDeps & {
  persisted: Array<{ kind: string; payload: Record<string, unknown> }>;
  audited: Array<{ kind: string; payload: Record<string, unknown> }>;
  queries: number;
} {
  const persisted: Array<{ kind: string; payload: Record<string, unknown> }> =
    [];
  const audited: Array<{ kind: string; payload: Record<string, unknown> }> =
    [];
  const base: AlipayNotifyDeps & {
    persisted: typeof persisted;
    audited: typeof audited;
    queries: number;
  } = {
    configured: true,
    verify: () => true,
    expectedAppId: "2021001",
    queryTrade: async () => {
      base.queries += 1;
      return { trade_status: "TRADE_SUCCESS", total_amount: "28.00" };
    },
    persist: async (kind, payload) => {
      persisted.push({ kind, payload });
    },
    audit: async (kind, payload) => {
      audited.push({ kind, payload });
    },
    catalogAmount: (productId) =>
      productId === "dianhong-classic" ? "28.00" : undefined,
    persisted,
    audited,
    queries: 0,
  };
  return Object.assign(base, overrides);
}

test("RSA2 failure returns 400 and does not log the body", async () => {
  const d = deps({ verify: () => false });
  const outcome = await handleAlipayNotify(
    {
      out_trade_no: "attacker",
      trade_status: "TRADE_SUCCESS",
      junk: "x".repeat(5000),
      passback_params: "gift-set",
    },
    d
  );
  assert.deepEqual(outcome, { status: 400, body: "failure" });
  assert.equal(d.persisted.length, 0);
  assert.equal(d.audited.length, 0);
  assert.equal(d.queries, 0);
});

test("app_id mismatch returns 400 without the param map", async () => {
  const d = deps();
  const outcome = await handleAlipayNotify(
    {
      app_id: "other-app",
      out_trade_no: "FQ1",
      trade_no: "T1",
      trade_status: "TRADE_SUCCESS",
      note: "do-not-log",
    },
    d
  );
  assert.deepEqual(outcome, { status: 400, body: "failure" });
  assert.equal(d.persisted.length, 0);
  assert.equal(d.audited.length, 0);
  assert.equal(d.queries, 0);
});

test("verified notify is not acknowledged when persistence fails", async () => {
  const d = deps({
    persist: async () => {
      throw new Error("disk full");
    },
  });
  const outcome = await handleAlipayNotify(
    {
      app_id: "2021001",
      out_trade_no: "FQ1",
      trade_no: "T1",
      trade_status: "TRADE_SUCCESS",
      total_amount: "28.00",
      passback_params: "dianhong-classic",
    },
    d
  );
  assert.deepEqual(outcome, { status: 500, body: "failure" });
});

test("verified notify succeeds after the event is stored", async () => {
  const d = deps();
  const outcome = await handleAlipayNotify(
    {
      app_id: "2021001",
      out_trade_no: "FQ1",
      trade_no: "T1",
      trade_status: "TRADE_SUCCESS",
      total_amount: "28.00",
      passback_params: "dianhong-classic",
    },
    d
  );
  assert.deepEqual(outcome, { status: 200, body: "success" });
  assert.equal(d.persisted.length, 1);
  assert.equal(d.persisted[0]?.kind, "notify");
  assert.equal(d.persisted[0]?.payload.outTradeNo, "FQ1");
  assert.equal("params" in (d.persisted[0]?.payload ?? {}), false);
  assert.equal(d.queries, 1);
});

test("query failure still acknowledges a verified notify that was stored", async () => {
  const d = deps({
    queryTrade: async () => {
      throw new Error("gateway down");
    },
  });
  const outcome = await handleAlipayNotify(
    {
      app_id: "2021001",
      out_trade_no: "FQ1",
      trade_status: "TRADE_SUCCESS",
      total_amount: "28.00",
      passback_params: "dianhong-classic",
    },
    d
  );
  assert.deepEqual(outcome, { status: 200, body: "success" });
  assert.equal(d.persisted.length, 1);
  assert.equal(d.persisted[0]?.payload.query, null);
});

test("amount mismatch does not acknowledge success or store the raw map", async () => {
  const d = deps({
    catalogAmount: () => "98.00",
  });
  const outcome = await handleAlipayNotify(
    {
      app_id: "2021001",
      out_trade_no: "FQ1",
      trade_status: "TRADE_SUCCESS",
      total_amount: "0.01",
      passback_params: "gift-set",
      extra: "secret",
    },
    d
  );
  assert.deepEqual(outcome, { status: 400, body: "failure" });
  assert.equal(d.persisted.length, 0);
  assert.equal(d.audited.length, 1);
  assert.equal(d.audited[0]?.kind, "notify_amount_mismatch");
  assert.equal("params" in (d.audited[0]?.payload ?? {}), false);
  assert.equal("extra" in (d.audited[0]?.payload ?? {}), false);
});
