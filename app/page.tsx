import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";
import { siteImages } from "@/lib/images";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  // Skip the 1¢ payment-test SKU on the homepage feature strip
  const featured = products
    .filter((product) => product.id !== "paypal-test-cent")
    .slice(0, 2);

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <Image
            src={siteImages.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <p className="eyebrow">Fengqing · Yunnan Highlands</p>
          <h1 className="hero-brand">凤庆滇红</h1>
          <p className="hero-english">Dianhong Black Tea</p>
          <p className="hero-text">
            高山茶园，工夫红茶。蜜香甘醇，一盏见山。
          </p>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-light">
              选购茶叶
            </Link>
            <Link href="/about" className="btn btn-hero-ghost">
              品牌故事
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-story">
        <div className="container split">
          <div className="split-media">
            <Image
              src={siteImages.story}
              alt="茶席倾注，热茶升腾"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center 30%" }}
            />
          </div>
          <div className="split-copy">
            <p className="eyebrow">Brand Story</p>
            <h2>一叶滇红，一盏时光</h2>
            <p className="muted">
              我们专注云南凤庆高山红茶，从茶园到杯中，坚持小批量精制。
              汤色红亮，蜜香与花果香交织，适合静心独饮，也适合与人分享。
            </p>
            <Link href="/about" className="btn btn-primary section-cta">
              了解更多
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-featured">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Featured Selection</p>
            <h2>热门产品</h2>
            <p>两款常年热销滇红。结账支持 PayPal 与支付宝。</p>
          </div>

          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="section-foot">
            <Link href="/products" className="btn btn-ghost">
              查看全部产品
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
