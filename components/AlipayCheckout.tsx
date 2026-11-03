"use client";

import { useState } from "react";

type AlipayCheckoutProps = {
  productId: string;
  productName: string;
  price: number;
};

/**
 * Alipay AI Pay (电脑网站支付) — creates a page-pay URL then redirects.
 * Amount is charged in CNY using the catalog number as yuan.
 */
export default function AlipayCheckout({
  productId,
  productName,
  price,
}: AlipayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled =
    (process.env.NEXT_PUBLIC_AIPAY_ENABLED || "true").toLowerCase() !==
    "false";

  if (!enabled) return null;

  return (
    <div className="alipay-checkout">
      <button
        type="button"
        className="btn btn-alipay"
        disabled={loading}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const response = await fetch("/api/alipay/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId }),
            });
            const data = (await response.json()) as {
              payUrl?: string;
              error?: string;
            };
            if (!response.ok || !data.payUrl) {
              throw new Error(data.error || "创建支付宝订单失败");
            }
            window.location.href = data.payUrl;
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "支付宝下单失败"
            );
            setLoading(false);
          }
        }}
      >
        {loading
          ? "正在跳转支付宝…"
          : `支付宝 · ¥${price.toFixed(2)}`}
      </button>
      <p className="checkout-hint alipay-hint">
        支付宝网页收款「{productName}」· 金额按人民币元计
      </p>
      {error ? <p className="paypal-error">{error}</p> : null}
    </div>
  );
}
