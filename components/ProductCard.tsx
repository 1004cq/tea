import Image from "next/image";
import type { Product } from "@/lib/products";
import { categoryLabels } from "@/lib/products";
import PayPalCheckout from "@/components/PayPalCheckout";
import AlipayCheckout from "@/components/AlipayCheckout";

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

export default function ProductCard({
  product,
  priority = false,
}: ProductCardProps) {
  const currency = (
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD"
  ).toUpperCase();
  const isTest = product.category === "test";
  const category =
    product.category !== "test" ? categoryLabels[product.category] : null;

  return (
    <article className={`product-item${isTest ? " is-test" : ""}`}>
      <div className="product-image">
        <Image
          src={product.image}
          alt={`${product.name} / ${product.nameEn}`}
          fill
          priority={priority}
          sizes="(max-width: 900px) 100vw, 58vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="product-body">
        <div className="product-meta">
          <div className="product-titles">
            {category ? (
              <p className="product-category">
                <span>{category.zh}</span>
                <span aria-hidden="true"> · </span>
                <span lang="en">{category.en}</span>
              </p>
            ) : null}
            <h3>{product.name}</h3>
            <p className="product-name-en" lang="en">
              {product.nameEn}
            </p>
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
        <p className="product-desc-en" lang="en">
          {product.descriptionEn}
        </p>

        {!isTest ? (
          <dl className="product-specs">
            <div>
              <dt>产地 Origin</dt>
              <dd>
                {product.origin}
                <span lang="en">{product.originEn}</span>
              </dd>
            </div>
            <div>
              <dt>工艺 Craft</dt>
              <dd>
                {product.craft}
                <span lang="en">{product.craftEn}</span>
              </dd>
            </div>
            <div>
              <dt>口感 Taste</dt>
              <dd>
                {product.taste}
                <span lang="en">{product.tasteEn}</span>
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="purchase-panel">
          <div className="purchase-head">
            <p className="purchase-label">Checkout · 结账</p>
            <p className="purchase-price-inline">
              {currency} {product.price.toFixed(2)}
            </p>
          </div>
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
