"use client";

import Image from "next/image";
import { siteImages } from "@/lib/images";
import { Reveal } from "@/components/landing/Motion";

export default function Philosophy() {
  return (
    <section
      id="philosophy"
      className="relative overflow-hidden border-t border-[#C9A227]/12 bg-[#120C08] py-24 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={siteImages.story}
              alt="红亮茶汤与茶席"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120C08]/55 to-transparent" />
          </div>
        </Reveal>

        <Reveal delay={0.12} className="max-w-lg">
          <p className="font-[family-name:var(--font-cormorant)] text-sm tracking-[0.32em] text-[#C9A227] uppercase">
            Philosophy
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-noto-serif)] text-3xl tracking-[0.14em] text-[#F5EFE6] md:text-4xl">
            一盏见山
          </h2>
          <p className="mt-6 text-base leading-8 text-[#F5EFE6]/75">
            我们相信好茶不必喧哗。小批量精制，清楚标注产地、等级与净重；包装克制，结账简单。让凤庆高山的蜜香与金芽，在杯中慢慢说话。
          </p>
          <blockquote className="mt-8 border-l border-[#C9A227]/55 pl-5 font-[family-name:var(--font-cormorant)] text-xl italic leading-relaxed text-[#F5EFE6]/85 md:text-2xl">
            “汤色红亮，金毫浮沉——那是云南山气落进瓷白里的样子。”
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
