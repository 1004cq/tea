import Image from "next/image";
import Link from "next/link";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const featured = products.slice(0, 2);

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=2000&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <p className="eyebrow">Fengqing · Yunnan</p>
          <h1 className="hero-brand">凤庆滇红</h1>
          <p className="hero-text">
            高山茶园，工夫红茶。蜜香甘醇，一盏见山。
          </p>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-light">
              选购茶叶
            </Link>
            <Link href="/about" className="btn btn-ghost" style={{ color: "#fffcf8", borderColor: "rgba(212,184,150,0.7)" }}>
              品牌故事
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="split-media">
            <Image
              src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1400&q=80"
              alt="滇红茶汤与茶叶"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="split-copy">
            <p className="eyebrow">Brand</p>
            <h2>一叶滇红，一盏时光</h2>
            <p className="muted">
              我们专注云南凤庆高山红茶，从茶园到杯中，坚持小批量精制。
              汤色红亮，蜜香与花果香交织，适合静心独饮，也适合与人分享。
            </p>
            <p className="muted">
              每一款茶叶均标明等级与净重，价格透明；结账由 PayPal 托管，安全可靠。
            </p>
            <div style={{ marginTop: "1.75rem" }}>
              <Link href="/about" className="btn btn-primary">
                了解更多
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Featured</p>
            <h2>热门产品</h2>
            <p>精选两款常年热销滇红，亦可前往产品页浏览全部茶款。</p>
          </div>

          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div style={{ marginTop: "2.5rem" }}>
            <Link href="/products" className="btn btn-ghost">
              查看全部产品
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
