"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

type GooglePayButtonProps = {
  productId: string;
  price: number;
  currency: string;
  onError: (message: string) => void;
};

type GooglePayConfig = {
  allowedPaymentMethods: unknown[];
  merchantInfo: unknown;
  apiVersion?: number;
  apiVersionMinor?: number;
  countryCode?: string;
};

type PayPalGooglePay = {
  config: () => Promise<GooglePayConfig>;
  confirmOrder: (params: {
    orderId: string;
    paymentMethodData: unknown;
  }) => Promise<{ status?: string }>;
  initiatePayerAction?: (params: { orderId: string }) => Promise<unknown>;
};

type GooglePaymentsClient = {
  isReadyToPay: (request: unknown) => Promise<{ result?: boolean }>;
  createButton: (options: {
    onClick: () => void;
    allowedPaymentMethods: unknown[];
    buttonColor?: string;
    buttonType?: string;
  }) => HTMLElement;
  loadPaymentData: (request: unknown) => Promise<unknown>;
};

type GoogleNamespace = {
  payments?: {
    api?: {
      PaymentsClient: new (options: {
        environment: "TEST" | "PRODUCTION";
        paymentDataCallbacks?: {
          onPaymentAuthorized: (paymentData: {
            paymentMethodData: unknown;
          }) => Promise<{
            transactionState: string;
            error?: { intent: string; message: string };
          }>;
        };
      }) => GooglePaymentsClient;
    };
  };
};

type PayPalWithGooglePay = {
  Googlepay?: () => PayPalGooglePay;
};

function getGoogleNamespace(): GoogleNamespace | undefined {
  return (window as Window & { google?: GoogleNamespace }).google;
}

function getPayPalGooglePay(): PayPalGooglePay | null {
  const paypal = (window as Window & { paypal?: PayPalWithGooglePay }).paypal;
  return paypal?.Googlepay ? paypal.Googlepay() : null;
}

function loadGooglePayScript(): Promise<void> {
  if (getGoogleNamespace()?.payments?.api) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-pay-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google Pay SDK failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    script.dataset.googlePaySdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Pay SDK failed to load"));
    document.body.appendChild(script);
  });
}

/**
 * Standalone Google Pay button via PayPal + Google Pay JS SDKs.
 * Only renders when the device/browser/merchant are eligible.
 */
export default function GooglePayButton({
  productId,
  price,
  currency,
  onError,
}: GooglePayButtonProps) {
  const router = useRouter();
  const [{ isResolved, options }] = usePayPalScriptReducer();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );

  useEffect(() => {
    if (!isResolved || !hostRef.current) return;

    let cancelled = false;
    const host = hostRef.current;
    host.innerHTML = "";

    async function setup() {
      try {
        await loadGooglePayScript();
        if (cancelled) return;

        const googleApi = getGoogleNamespace()?.payments?.api;
        const googlePay = getPayPalGooglePay();
        if (!googlePay || !googleApi) {
          setStatus("unavailable");
          return;
        }

        const googlePayConfig = await googlePay.config();
        const environment =
          process.env.NEXT_PUBLIC_PAYPAL_MODE === "live" ||
          // Fall back: production host uses live credentials
          (typeof window !== "undefined" &&
            window.location.hostname === "shop.duojiayi.com")
            ? "PRODUCTION"
            : "TEST";

        const paymentsClient = new googleApi.PaymentsClient({
          environment,
          paymentDataCallbacks: {
            onPaymentAuthorized: async (paymentData) => {
              try {
                const createResponse = await fetch("/api/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId }),
                });
                const created = (await createResponse.json()) as {
                  orderID?: string;
                  error?: string;
                };
                if (!createResponse.ok || !created.orderID) {
                  throw new Error(created.error || "创建订单失败");
                }

                const confirm = await googlePay.confirmOrder({
                  orderId: created.orderID,
                  paymentMethodData: paymentData.paymentMethodData,
                });

                if (confirm.status === "PAYER_ACTION_REQUIRED") {
                  await googlePay.initiatePayerAction?.({
                    orderId: created.orderID,
                  });
                }

                if (
                  confirm.status !== "APPROVED" &&
                  confirm.status !== "COMPLETED" &&
                  confirm.status !== "PAYER_ACTION_REQUIRED"
                ) {
                  throw new Error(`Google Pay 确认失败（${confirm.status}）`);
                }

                const captureResponse = await fetch("/api/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: created.orderID }),
                });
                const captureResult = (await captureResponse.json()) as {
                  error?: string;
                };
                if (!captureResponse.ok) {
                  throw new Error(captureResult.error || "支付捕获失败");
                }

                router.push(
                  `/success?product=${encodeURIComponent(productId)}`
                );
                return { transactionState: "SUCCESS" };
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Google Pay 失败";
                onError(message);
                return {
                  transactionState: "ERROR",
                  error: {
                    intent: "PAYMENT_AUTHORIZATION",
                    message,
                  },
                };
              }
            },
          },
        });

        const ready = await paymentsClient.isReadyToPay({
          apiVersion: googlePayConfig.apiVersion ?? 2,
          apiVersionMinor: googlePayConfig.apiVersionMinor ?? 0,
          allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
        });

        if (cancelled) return;
        if (!ready.result) {
          setStatus("unavailable");
          return;
        }

        const button = paymentsClient.createButton({
          buttonColor: "black",
          buttonType: "pay",
          allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
          onClick: () => {
            void (async () => {
              try {
                const paymentDataRequest = {
                  apiVersion: googlePayConfig.apiVersion ?? 2,
                  apiVersionMinor: googlePayConfig.apiVersionMinor ?? 0,
                  allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
                  merchantInfo: googlePayConfig.merchantInfo,
                  transactionInfo: {
                    countryCode: googlePayConfig.countryCode || "US",
                    currencyCode: currency,
                    totalPriceStatus: "FINAL",
                    totalPrice: price.toFixed(2),
                  },
                  callbackIntents: ["PAYMENT_AUTHORIZATION"],
                };
                await paymentsClient.loadPaymentData(paymentDataRequest);
              } catch (error) {
                // User closed sheet — ignore cancel-like errors
                const message =
                  error instanceof Error ? error.message : String(error);
                if (!/cancel|closed|abort/i.test(message)) {
                  onError(message || "无法打开 Google Pay");
                }
              }
            })();
          },
        });

        host.appendChild(button);
        setStatus("ready");
      } catch (error) {
        console.error("[GooglePay]", error);
        if (!cancelled) setStatus("unavailable");
      }
    }

    void setup();

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [
    isResolved,
    options.clientId,
    productId,
    price,
    currency,
    onError,
    router,
  ]);

  if (status === "unavailable") {
    return null;
  }

  return (
    <div className="google-pay-wrap">
      {status === "loading" ? (
        <p className="checkout-hint">正在检测 Google Pay…</p>
      ) : null}
      <div ref={hostRef} className="google-pay-host" />
    </div>
  );
}
