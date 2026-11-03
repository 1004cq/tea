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

  return (
    <article className="product-item">
      <div className="product-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div className="product-body">
        <div className="product-meta">
          <h3>{product.name}</h3>
          <span className="product-price">
            {currency} {product.price.toFixed(2)}
            <span className="price-cny"> / ¥{product.price.toFixed(2)}</span>
          </span>
        </div>

        <div className="product-tags">
          <span>{product.grade}</span>
          <span>{product.weight}</span>
          <span className="tag-en">{product.nameEn}</span>
        </div>

        <p className="product-desc">{product.description}</p>

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
    </article>
  );
}
