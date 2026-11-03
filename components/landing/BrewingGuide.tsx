"use client";

import { Reveal, Stagger, StaggerItem } from "@/components/landing/Motion";

const steps = [
  {
    step: "01",
    title: "择器",
    detail: "白瓷盖碗或玻璃公道，便于观汤色与金毫。",
    meta: "茶具 · Gaiwan",
  },
  {
    step: "02",
    title: "水温",
    detail: "90–95°C 热水，唤醒蜜香而不夺甜润。",
    meta: "水温 · 90–95°C",
  },
  {
    step: "03",
    title: "投茶",
    detail: "茶水比约 1:30，可依口感略作增减。",
    meta: "比例 · 1:30",
  },
  {
    step: "04",
    title: "出汤",
    detail: "首泡 10–15 秒，随后逐泡略延，可冲泡多次。",
    meta: "时间 · 10–15s+",
  },
];

export default function BrewingGuide() {
  return (
    <section
      id="brew"
      className="relative overflow-hidden bg-[#120C08] py-24 md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #C9A227 0.8px, transparent 1px), radial-gradient(circle at 80% 60%, #8B3A3A 0.8px, transparent 1px)",
          backgroundSize: "28px 28px, 36px 36px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="max-w-xl">
          <p className="font-[family-name:var(--font-cormorant)] text-sm tracking-[0.32em] text-[#C9A227] uppercase">
            Brewing Guide
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-noto-serif)] text-3xl tracking-[0.14em] text-[#F5EFE6] md:text-4xl">
            冲泡指南
          </h2>
          <p className="mt-4 text-[#F5EFE6]/7">
            四步见山：器物、水温、投茶与出汤，让金芽与蜜香层层展开。
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-0 md:grid-cols-4">
          {steps.map((item, index) => (
            <StaggerItem key={item.step}>
              <article
                className={`relative h-full border border-[#C9A227]/18 bg-[#1A120B]/70 p-6 md:border-l-0 ${
                  index === 0 ? "md:border-l" : ""
                }`}
              >
                <span className="font-[family-name:var(--font-cormorant)] text-4xl text-[#8B3A3A]/80">
                  {item.step}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.16em] text-[#F5EFE6]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs tracking-[0.2em] text-[#C9A227]">
                  {item.meta}
                </p>
                <p className="mt-4 text-sm leading-7 text-[#F5EFE6]/68">
                  {item.detail}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
