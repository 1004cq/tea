"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalButtons,
  PayPalScriptProvider,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import GooglePayButton from "@/components/GooglePayButton";

type PayPalCheckoutProps = {
  productId: string;
  productName: string;
  price: number;
};

/**
 * PayPal Buttons for a single product.
 * createOrder / onApprove call our Next.js API routes so the secret never leaves the server.
 * Google Pay is rendered as a separate button when eligible.
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
      // buttons = PayPal/Apple Pay stack; googlepay = paypal.Googlepay() API
      components: "buttons,googlepay",
      enableFunding: "applepay",
    }),
    [clientId, currency]
  );

  const handleGoogleError = useCallback((message: string) => {
    setError(message);
  }, []);

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
            正在为「{productName}」唤起支付… Apple Pay 请用 Safari；Google Pay
            请用 Chrome，并在 PayPal Live 应用中勾选 Google Pay。
          </p>
          <PayPalScriptProvider options={options}>
            <GooglePayButton
              productId={productId}
              price={price}
              currency={currency}
              onError={handleGoogleError}
            />
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
                    : "支付失败。Apple Pay 请用 Safari；Google Pay 请用 Chrome，并确认 PayPal 后台已启用对应支付方式。"
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
