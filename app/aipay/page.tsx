import type { Metadata } from "next";
import Link from "next/link";
import { getProductById } from "@/lib/products";
import {
  capAlipayLogField,
  formatCnyAmount,
  isAlipayConfigured,
  queryAlipayTrade,
  tryAppendAlipayEvent,
  verifyAlipayNotify,
} from "@/lib/alipay";
import {
  assessAlipayReturn,
  canQueryAlipayReturn,
  decodeAlipayPassback,
  readAlipayString,
} from "@/lib/alipay-return";

export const metadata: Metadata = {
  title: "支付宝结果",
  description: "支付宝网页支付同步返回页。",
};

export const dynamic = "force-dynamic";

type AlipayReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * GET /aipay — Alipay sync return_url.
 * A valid RSA2 signature is required before trade.query and before
 * showing paid or product confirmation. The product comes from signed
 * passback / query passback only when the paid amount matches it.
 */
export default async function AlipayReturnPage({
  searchParams,
}: AlipayReturnPageProps) {
  const params = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const v = first(value);
    if (v != null) flat[key] = v;
  }

  const outTradeNo = flat.out_trade_no || "";
  const tradeNo = flat.trade_no || "";
  const hasReturnParams = Object.keys(flat).length > 0;

  let verified = false;
  let tradeStatus: string | undefined;
  let queryError: string | undefined;
  let paid = false;
  let confirmedProductId = "";

  if (isAlipayConfigured() && hasReturnParams) {
    try {
      verified = verifyAlipayNotify(flat);
    } catch {
      verified = false;
    }
  }

  if (canQueryAlipayReturn(verified, outTradeNo, tradeNo)) {
    try {
      const query = await queryAlipayTrade({ outTradeNo, tradeNo });
      tradeStatus = readAlipayString(query, "tradeStatus", "trade_status");
      const signedId = decodeAlipayPassback(flat.passback_params);
      const queryPassback = readAlipayString(
        query,
        "passbackParams",
        "passback_params"
      );
      const queryId = decodeAlipayPassback(queryPassback);
      const candidateId =
        signedId && queryId && signedId !== queryId ? "" : queryId || signedId;
      const candidate = candidateId ? getProductById(candidateId) : undefined;
      const assessment = assessAlipayReturn({
        verified: true,
        tradeStatus,
        signedPassback: flat.passback_params,
        queryPassback,
        queryAmount: readAlipayString(query, "totalAmount", "total_amount"),
        signedAmount: flat.total_amount,
        catalogAmount: candidate
          ? formatCnyAmount(candidate.price)
          : undefined,
      });
      paid = assessment.paid;
      confirmedProductId = assessment.productId;

      await tryAppendAlipayEvent("return", {
        outTradeNo: capAlipayLogField(outTradeNo),
        tradeNo: capAlipayLogField(tradeNo),
        verified: true,
        tradeStatus: capAlipayLogField(tradeStatus),
        productId: assessment.productId
          ? capAlipayLogField(assessment.productId)
          : undefined,
        amountMatches: assessment.amountMatches,
        query,
      });
    } catch (error) {
      queryError =
        error instanceof Error ? error.message : "查询交易失败";
      await tryAppendAlipayEvent("return_query_error", {
        outTradeNo: capAlipayLogField(outTradeNo),
        tradeNo: capAlipayLogField(tradeNo),
        verified: true,
        message: capAlipayLogField(queryError, 300),
      });
    }
  }

  const product = confirmedProductId
    ? getProductById(confirmedProductId)
    : undefined;

  return (
    <section className="container success-panel">
      <div>
        <div className="success-mark" aria-hidden="true">
          {paid ? "✓" : "…"}
        </div>
        <p className="eyebrow" style={{ marginTop: "1.5rem" }}>
          Alipay
        </p>
        <h1>{paid ? "支付成功" : "支付处理中"}</h1>
        <p className="muted" style={{ maxWidth: "32rem", margin: "0 auto 1rem" }}>
          {paid
            ? product
              ? `您已通过支付宝购买「${product.name}」。`
              : "支付宝付款已确认。"
            : "已从支付宝返回。最终结果以异步通知或交易查询为准；若已付款，片刻后订单将自动确认。"}
        </p>

        <dl className="aipay-meta">
          {outTradeNo ? (
            <>
              <dt>商户订单号</dt>
              <dd>{outTradeNo}</dd>
            </>
          ) : null}
          {tradeNo ? (
            <>
              <dt>支付宝交易号</dt>
              <dd>{tradeNo}</dd>
            </>
          ) : null}
          {tradeStatus ? (
            <>
              <dt>交易状态</dt>
              <dd>{tradeStatus}</dd>
            </>
          ) : null}
          {hasReturnParams ? (
            <>
              <dt>同步验签</dt>
              <dd>{verified ? "通过" : "未通过或无签名"}</dd>
            </>
          ) : null}
          {queryError ? (
            <>
              <dt>查询</dt>
              <dd>{queryError}</dd>
            </>
          ) : null}
        </dl>

        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/products" className="btn btn-primary">
            继续选购
          </Link>
          <Link href="/" className="btn btn-ghost">
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
