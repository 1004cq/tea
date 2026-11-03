import type { Metadata } from "next";
import Image from "next/image";
import { siteImages } from "@/lib/images";

export const metadata: Metadata = {
  title: "关于",
  description: "了解凤庆红茶与滇红的品牌故事。",
};

export default function AboutPage() {
  return (
    <>
      <section className="section section-page">
        <div className="container page-hero">
          <p className="eyebrow">About</p>
          <h1>关于凤庆滇红</h1>
          <p className="muted page-lead">
            滇红产自云南，凤庆是其重要产地之一。我们以工夫红茶工艺，呈现高山茶的蜜香与醇厚。
          </p>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container split">
          <div className="split-media">
            <Image
              src={siteImages.about}
              alt="高山茶园采摘"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center 35%" }}
            />
          </div>
          <div className="split-copy prose">
            <p className="eyebrow">Origin</p>
            <h2>凤庆茶山</h2>
            <p className="muted">
              凤庆地处云南临沧，群山云雾，昼夜温差明显，茶树生长缓慢，内含物质丰富。
              早春采摘的一芽一叶、一芽二叶，经萎凋、揉捻、发酵、干燥等工夫红茶工序，
              形成滇红标志性的红亮汤色与蜜香。
            </p>
            <p className="muted">
              我们相信好茶不必喧哗。包装克制，说明清晰，让茶叶本身成为主角。
            </p>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Craft</p>
            <h2>品牌故事</h2>
            <p>
              从茶园到杯中，我们坚持小批量精制。每一款产品标注等级与净重，
              方便按日常、品鉴或礼赠选择。
            </p>
          </div>
          <div className="prose">
            <p className="muted">
              若您初次接触滇红，可从「经典滇红」开始；若偏爱金毫与高扬蜜香，推荐「金芽滇红」；
              喜欢更温润的陈香，可尝试「陈韵滇红」。礼盒则为双拼组合，适合送人与自饮。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
