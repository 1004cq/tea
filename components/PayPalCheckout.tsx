"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalButtons,
  PayPalScriptProvider,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";

type PayPalCheckoutProps = {
  productId: string;
  productName: string;
  price: number;
};

/**
 * PayPal Buttons for a single product.
 * createOrder / onApprove call our Next.js API routes so the secret never leaves the server.
 */
export default function PayPalCheckout({
  productId,
  productName,
  price,
}: PayPalCheckoutProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const currency = (
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD"
  ).toUpperCase();

  const options = useMemo<ReactPayPalScriptOptions>(
    () => ({
      clientId: clientId || "test",
      currency,
      intent: "capture",
      components: "buttons",
      // Show Apple Pay in the Smart Buttons stack when device/account eligible
      enableFunding: "applepay",
    }),
    [clientId, currency]
  );

  if (!clientId) {
    return (
      <div className="checkout-panel">
        <p className="checkout-hint">
          尚未配置 PayPal Client ID。请在 `.env.local` 中设置
          `NEXT_PUBLIC_PAYPAL_CLIENT_ID` 后重启开发服务器。
        </p>
        <button type="button" className="btn btn-primary" disabled>
          购买 · {currency} {price.toFixed(2)}
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-panel">
      {!started ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setError(null);
            setStarted(true);
          }}
        >
          购买 · {currency} {price.toFixed(2)}
        </button>
      ) : (
        <>
          <p className="checkout-hint">
            正在为「{productName}」唤起 PayPal… Apple Pay 请用 Safari，并确保
            PayPal 后台已注册本站域名。
          </p>
          <PayPalScriptProvider options={options}>
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "gold",
                shape: "rect",
                label: "pay",
              }}
              createOrder={async () => {
                setError(null);
                const response = await fetch("/api/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId }),
                });

                const data = (await response.json()) as {
                  orderID?: string;
                  error?: string;
                };

                if (!response.ok || !data.orderID) {
                  throw new Error(data.error || "创建订单失败");
                }

                return data.orderID;
              }}
              onApprove={async (data) => {
                const response = await fetch("/api/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: data.orderID }),
                });

                const result = (await response.json()) as { error?: string };
                if (!response.ok) {
                  throw new Error(result.error || "支付确认失败");
                }

                router.push(`/success?product=${encodeURIComponent(productId)}`);
              }}
              onError={(err) => {
                console.error("[PayPal]", err);
                const detail =
                  err && typeof err === "object" && "message" in err
                    ? String((err as { message?: unknown }).message || "")
                    : "";
                setError(
                  detail
                    ? `支付失败：${detail}`
                    : "支付失败。若使用 Apple Pay，请改用 Safari，并确认 PayPal Live 已注册 shop.duojiayi.com。"
                );
                setStarted(false);
              }}
              onCancel={() => {
                setError("已取消支付。");
                setStarted(false);
              }}
            />
          </PayPalScriptProvider>
        </>
      )}

      {error ? <p className="paypal-error">{error}</p> : null}
    </div>
  );
}
