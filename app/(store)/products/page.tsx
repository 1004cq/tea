import type { Metadata } from "next";
import {
  categoryLabels,
  getCatalogProducts,
  getProductById,
  type ProductCategory,
} from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "产品 Products",
  description:
    "Browse Fengqing Dianhong: classic, golden needle, aged, and gift set.",
};

const order: Exclude<ProductCategory, "test">[] = [
  "daily",
  "tasting",
  "gift",
];

export default function ProductsPage() {
  const catalog = getCatalogProducts();
  const showTestSku =
    process.env.SHOW_TEST_SKU === "true" ||
    process.env.NODE_ENV !== "production";
  const testSku = showTestSku ? getProductById("paypal-test-cent") : undefined;

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Collection</p>
          <h1>产品</h1>
          <p className="muted page-lead">
            按场景选茶：日常、品鉴与礼赠。每款标明产地与口感。
          </p>
          <ul className="category-rail" aria-label="产品分类">
            {order.map((key) => (
              <li key={key}>
                <a href={`#cat-${key}`}>
                  {categoryLabels[key].zh}
                  <span lang="en">{categoryLabels[key].en}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {order.map((key) => {
          const items = catalog.filter((p) => p.category === key);
          if (!items.length) return null;
          return (
            <div key={key} id={`cat-${key}`} className="catalog-block">
              <div className="section-head compact">
                <p className="eyebrow">{categoryLabels[key].en}</p>
                <h2>{categoryLabels[key].zh}</h2>
              </div>
              <div className="product-grid">
                {items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={key === "daily" && index === 0}
                  />
                ))}
              </div>
            </div>
          );
        })}

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
