import Image from "next/image";
import type { Product } from "@/lib/products";
import PayPalCheckout from "@/components/PayPalCheckout";
import AlipayCheckout from "@/components/AlipayCheckout";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const currency = (
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD"
  ).toUpperCase();
  const isTest = product.id === "paypal-test-cent";

  return (
    <article className={`product-item${isTest ? " is-test" : ""}`}>
      <div className="product-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 900px) 100vw, 46vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="product-body">
        <div className="product-meta">
          <div className="product-titles">
            <h3>{product.name}</h3>
            <p className="product-name-en">{product.nameEn}</p>
          </div>
          <div className="product-price" aria-label="价格">
            <span className="price-main">
              {currency} {product.price.toFixed(2)}
            </span>
            <span className="price-cny">¥{product.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="product-tags">
          <span>{product.grade}</span>
          <span>{product.weight}</span>
        </div>

        <p className="product-desc">{product.description}</p>

        <div className="purchase-panel">
          <p className="purchase-label">结账</p>
          <PayPalCheckout
            productId={product.id}
            productName={product.name}
            price={product.price}
          />
          <AlipayCheckout
            productId={product.id}
            productName={product.name}
            price={product.price}
          />
        </div>
      </div>
    </article>
  );
}
