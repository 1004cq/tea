import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "关于 About",
  description:
    "Fengqing Dianhong origin, history of Yunnan black tea, and our craft.",
};

export default function AboutPage() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero-media" aria-hidden="true">
          <Image
            src={siteImages.about}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
          <div className="about-hero-overlay" />
        </div>
        <div className="about-hero-content">
          <p className="eyebrow">About</p>
          <h1>关于凤庆滇红</h1>
          <p>
            滇红产自云南，凤庆是其重要发祥地之一。工夫红茶工艺，呈现高山茶的蜜香与醇厚。
          </p>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container split">
          <div className="split-media">
            <Image
              src={siteImages.story}
              alt="茶汤与干茶"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center 30%" }}
            />
          </div>
          <div className="split-copy prose">
            <p className="eyebrow">Origin</p>
            <h2>凤庆茶区</h2>
            <p className="muted">
              凤庆地处云南临沧，群山云雾，昼夜温差明显，茶树生长缓慢，内含物质丰富。
              早春采摘的一芽一叶、一芽二叶，经萎凋、揉捻、发酵、干燥等工夫红茶工序，
              形成滇红标志性的红亮汤色与蜜香。
            </p>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container about-history">
          <div className="section-head">
            <p className="eyebrow">History</p>
            <h2>滇红历史</h2>
            <p>
              1939 年，茶叶专家冯绍裘先生在凤庆试制成功滇红工夫茶。
              金毫显露、蜜香高扬的风格，使云南红茶迅速被世界认识。
            </p>
          </div>
          <div className="history-grid">
            <article>
              <h3>1939</h3>
              <p className="muted">
                冯绍裘在凤庆创制滇红，奠定工夫红茶在云南的工艺基础。
              </p>
            </article>
            <article>
              <h3>产地</h3>
              <p className="muted">
                临沧凤庆成为滇红核心产区，高山茶园至今仍是品质的重要坐标。
              </p>
            </article>
            <article>
              <h3>今日</h3>
              <p className="muted">
                独立站直达顾客：说明清楚、包装克制、结账简单，让好茶不必喧哗。
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Craft</p>
            <h2>我们的坚持</h2>
            <p>
              小批量精制。每一款产品标注等级与净重，方便按日常、品鉴或礼赠选择。
            </p>
          </div>
          <div className="about-cta">
            <Link href="/products" className="btn btn-primary">
              选购 · Shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
