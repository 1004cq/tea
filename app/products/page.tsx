import type { Metadata } from "next";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "产品",
  description: "浏览凤庆滇红产品：经典滇红、金芽、陈韵与礼盒。",
};

export default function ProductsPage() {
  const catalog = products.filter((p) => p.id !== "paypal-test-cent");
  const testSku = products.find((p) => p.id === "paypal-test-cent");

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Collection</p>
          <h1>产品</h1>
          <p className="muted page-lead">
            四款代表性滇红，覆盖日常品饮、静心品鉴与礼赠。支持 PayPal 与支付宝结账。
          </p>
        </div>

        <div className="product-grid">
          {catalog.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {testSku ? (
          <div className="test-sku-block">
            <div className="section-head compact">
              <p className="eyebrow">Payment Test</p>
              <h2>支付联调</h2>
              <p>仅用于验证最低金额收款，非正式售卖。</p>
            </div>
            <div className="product-grid">
              <ProductCard product={testSku} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
