import type { Metadata } from "next";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "产品",
  description: "浏览凤庆滇红产品：经典滇红、金芽、陈韵与礼盒。",
};

export default function ProductsPage() {
  return (
    <section className="section" style={{ paddingTop: "3rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Collection</p>
          <h1>产品</h1>
          <p className="muted" style={{ maxWidth: "36rem" }}>
            四款代表性滇红，覆盖日常品饮、静心品鉴与礼赠场景。点击购买后将通过
            PayPal 安全结账。
          </p>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
