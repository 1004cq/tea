import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "支付成功",
  description: "感谢您的购买。",
};

type SuccessPageProps = {
  searchParams: Promise<{ product?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const product = params.product ? getProductById(params.product) : undefined;
  const session = await auth();

  return (
    <section className="container success-panel">
      <div>
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <p className="eyebrow" style={{ marginTop: "1.5rem" }}>
          Thank you
        </p>
        <h1>支付成功</h1>
        <p className="muted" style={{ maxWidth: "28rem", margin: "0 auto 2rem" }}>
          {product
            ? `您已成功购买「${product.name}」。订单详情以 PayPal 或支付宝账户为准。`
            : "您的付款已完成。订单详情以 PayPal 或支付宝账户为准。"}
          {session?.user
            ? " 也可在个人中心查看已关联的 PayPal 订单。"
            : " 登录后可在个人中心查看已关联的 PayPal 订单。"}
        </p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/products" className="btn btn-primary">
            继续选购
          </Link>
          <Link
            href={session?.user ? "/account" : "/login"}
            className="btn btn-ghost"
          >
            {session?.user ? "个人中心" : "登录查看订单"}
          </Link>
        </div>
      </div>
    </section>
  );
}
