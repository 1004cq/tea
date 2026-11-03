import Image from "next/image";
import Link from "next/link";
import { getCatalogProducts } from "@/lib/products";
import { siteImages } from "@/lib/images";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const featured = getCatalogProducts().slice(0, 2);

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
          <p className="eyebrow">Fengqing · Yunnan</p>
          <h1 className="hero-brand">凤庆滇红</h1>
          <p className="hero-english">Dianhong Black Tea</p>
          <p className="hero-text">
            高山茶园，工夫红茶。蜜香甘醇，一盏见山。
          </p>
          <p className="hero-text-en" lang="en">
            Highland gardens. Gongfu craft. Honeyed liquor in every cup.
          </p>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-light">
              Shop Tea · 选购
            </Link>
            <Link href="/about" className="btn btn-hero-ghost">
              Our Story · 故事
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-pillars">
        <div className="container pillars">
          <article className="pillar">
            <p className="eyebrow">Origin</p>
            <h2>凤庆产地</h2>
            <p className="muted">
              云南临沧凤庆，云雾高山，昼夜温差明显。茶树生长缓慢，内含物质丰富，是滇红核心产区之一。
            </p>
            <p className="pillar-en" lang="en">
              Fengqing, Lincang — misted highlands and the heartland of Yunnan
              black tea.
            </p>
          </article>
          <article className="pillar">
            <p className="eyebrow">History</p>
            <h2>滇红源流</h2>
            <p className="muted">
              1939 年，冯绍裘先生在凤庆创制滇红工夫茶，以金毫显露、蜜香高扬闻名，开启云南红茶走向世界的篇章。
            </p>
            <p className="pillar-en" lang="en">
              Crafted in 1939 by Feng Shaoqiu — the birth of Dianhong gongfu
              black tea.
            </p>
          </article>
          <article className="pillar">
            <p className="eyebrow">Craft</p>
            <h2>小批量精制</h2>
            <p className="muted">
              从茶园到杯中，我们坚持清晰标注等级与净重，不做复杂套路，让茶叶本身说话。
            </p>
            <p className="pillar-en" lang="en">
              Small-batch lots, clear grades and weights — tea first, less noise.
            </p>
          </article>
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
            <p className="eyebrow">From Garden to Cup</p>
            <h2>一叶滇红，一盏时光</h2>
            <p className="muted">
              汤色红亮，蜜香与花果香交织。适合静心独饮，也适合与人分享。我们把产地故事写清楚，把购买路径做简单。
            </p>
            <p className="split-en" lang="en">
              Bright liquor, honey and fruit notes — a clean modern shop for an
              old Yunnan craft.
            </p>
            <Link href="/about" className="btn btn-primary section-cta">
              Read more · 了解更多
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-featured">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Featured</p>
            <h2>核心产品</h2>
            <p>两款入门与品鉴代表作。Checkout via PayPal or Alipay.</p>
          </div>

          <div className="product-grid">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>

          <div className="section-foot">
            <Link href="/products" className="btn btn-ghost">
              All teas · 全部产品
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
