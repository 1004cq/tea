import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { categoryLabels } from "@/lib/products";

type FeaturedTeaserProps = {
  product: Product;
  priority?: boolean;
};

/**
 * Home featured row — browse first, buy on the products page.
 */
export default function FeaturedTeaser({
  product,
  priority = false,
}: FeaturedTeaserProps) {
  const currency = (
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD"
  ).toUpperCase();
  const category =
    product.category !== "test" ? categoryLabels[product.category] : null;

  return (
    <article className="featured-teaser">
      <Link href={`/products#${product.id}`} className="featured-teaser-media">
        <Image
          src={product.image}
          alt={`${product.name} / ${product.nameEn}`}
          fill
          priority={priority}
          sizes="(max-width: 900px) 100vw, 48vw"
          style={{ objectFit: "cover" }}
        />
      </Link>
      <div className="featured-teaser-body">
        {category ? (
          <p className="product-category">
            <span>{category.zh}</span>
            <span aria-hidden="true"> · </span>
            <span lang="en">{category.en}</span>
          </p>
        ) : null}
        <h3>
          <Link href={`/products#${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-name-en" lang="en">
          {product.nameEn}
        </p>
        <p className="featured-teaser-meta">
          {product.grade} · {product.weight}
        </p>
        <p className="featured-teaser-desc">{product.description}</p>
        <div className="featured-teaser-price" aria-label="价格">
          <span>
            {currency} {product.price.toFixed(2)}
          </span>
          <span>¥{product.priceCny.toFixed(2)}</span>
        </div>
        <Link href={`/products#${product.id}`} className="btn btn-primary">
          选购 · Shop
        </Link>
      </div>
    </article>
  );
}
