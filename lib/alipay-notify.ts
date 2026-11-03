import { capAlipayLogField } from "./alipay";
import { decodeAlipayPassback } from "./alipay-return";

export type AlipayNotifyOutcome = {
  status: number;
  body: "success" | "failure";
};

export type AlipayNotifyDeps = {
  configured: boolean;
  verify: (params: Record<string, string>) => boolean;
  expectedAppId: string;
  queryTrade: (input: {
    outTradeNo?: string;
    tradeNo?: string;
  }) => Promise<Record<string, unknown>>;
  /** Required for a verified notify. Throw to withhold the success ack. */
  persist: (kind: string, payload: Record<string, unknown>) => Promise<void>;
  /** Optional audit. Failures must not turn into a success ack. */
  audit: (kind: string, payload: Record<string, unknown>) => Promise<void>;
  /** Catalog amount (yuan, two decimals) when passback names a product. */
  catalogAmount: (productId: string) => string | undefined;
};

/**
 * Decide the Alipay notify response.
 * Unsigned bodies and app_id mismatches are rejected without persistence.
 * A verified notify is acknowledged only after persist resolves.
 */
export async function handleAlipayNotify(
  params: Record<string, string>,
  deps: AlipayNotifyDeps
): Promise<AlipayNotifyOutcome> {
  if (!deps.configured) {
    return { status: 503, body: "failure" };
  }

  let signedOk = false;
  try {
    signedOk = deps.verify(params);
  } catch (error) {
    console.error("[aipay/notify] signature verification error", error);
    signedOk = false;
  }
  if (!signedOk) {
    console.error("[aipay/notify] signature verification failed");
    return { status: 400, body: "failure" };
  }

  const appId = params.app_id || "";
  if (deps.expectedAppId && appId !== deps.expectedAppId) {
    console.error("[aipay/notify] app_id mismatch");
    return { status: 400, body: "failure" };
  }

  const outTradeNo = params.out_trade_no || "";
  const tradeNo = params.trade_no || "";
  const tradeStatus = params.trade_status || "";
  const totalAmount = params.total_amount || "";
  const passback = decodeAlipayPassback(params.passback_params);

  if (passback && totalAmount) {
    const expected = deps.catalogAmount(passback);
    if (expected && totalAmount !== expected) {
      await deps.audit("notify_amount_mismatch", {
        outTradeNo: capAlipayLogField(outTradeNo),
        totalAmount: capAlipayLogField(totalAmount),
        expected,
        productId: capAlipayLogField(passback),
      });
      return { status: 400, body: "failure" };
    }
  }

  let query: Record<string, unknown> | null = null;
  try {
    if (outTradeNo || tradeNo) {
      query = await deps.queryTrade({ outTradeNo, tradeNo });
    }
  } catch (error) {
    console.error("[aipay/notify] query failed", error);
  }

  try {
    await deps.persist("notify", {
      outTradeNo: capAlipayLogField(outTradeNo),
      tradeNo: capAlipayLogField(tradeNo),
      tradeStatus: capAlipayLogField(tradeStatus),
      totalAmount: capAlipayLogField(totalAmount),
      productId: passback ? capAlipayLogField(passback) : undefined,
      query,
    });
  } catch (error) {
    console.error("[aipay/notify] verified notify was not persisted", error);
    return { status: 500, body: "failure" };
  }

  return { status: 200, body: "success" };
}
