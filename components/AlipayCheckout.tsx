"use client";

import { useState } from "react";

type AlipayCheckoutProps = {
  productId: string;
  productName: string;
  price: number;
};

function preferWapCheckout(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const narrow =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 820px)").matches;
  const mobileUa =
    /Android|iPhone|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      ua
    );
  // Prefer WAP on phones / narrow touch devices; keep iPad-ish wide tablets on PC QR.
  if (/iPad|Tablet/i.test(ua) && !/Mobile/i.test(ua) && !narrow) return false;
  return mobileUa || (coarse && narrow);
}

/**
 * Alipay checkout — PC page pay or mobile wap pay.
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
        className="btn btn-alipay btn-checkout"
        disabled={loading}
        aria-label={`支付宝购买 ${productName}`}
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const channel = preferWapCheckout() ? "wap" : "page";
            const response = await fetch("/api/alipay/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, channel }),
            });
            const data = (await response.json()) as {
              payUrl?: string;
              channel?: string;
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
      {error ? <p className="paypal-error">{error}</p> : null}
    </div>
  );
}
