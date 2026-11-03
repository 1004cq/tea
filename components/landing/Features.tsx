"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/Motion";

const features = [
  {
    title: "金芽",
    en: "Golden Tips",
    body: "早春肥壮芽叶，金毫满披。冲泡后金毫浮沉，汤色红艳明亮。",
  },
  {
    title: "蜜香",
    en: "Honey Aroma",
    body: "蜜香与花果香交织，温杯即现，杯底留香持久而不腻。",
  },
  {
    title: "醇厚",
    en: "Rich Body",
    body: "汤感绵厚甜润，入口柔和，回甘分明，适合静心独饮。",
  },
  {
    title: "耐泡",
    en: "Enduring",
    body: "工夫红茶骨架稳健，可多次冲泡，香气汤色层层递进。",
  },
];

export default function Features() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="bg-[#1A120B] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="max-w-xl">
          <p className="font-[family-name:var(--font-cormorant)] text-sm tracking-[0.32em] text-[#C9A227] uppercase">
            Signature Notes
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-noto-serif)] text-3xl tracking-[0.14em] text-[#F5EFE6] md:text-4xl">
            滇红之味
          </h2>
          <p className="mt-4 text-[#F5EFE6]/7">
            四味一脉：看得见的金毫，闻得到的蜜香，喝得着的醇厚与耐泡。
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <StaggerItem key={item.title}>
              <motion.article
                whileHover={
                  reduce
                    ? undefined
                    : {
                        scale: 1.035,
                        y: -4,
                        transition: { type: "spring", stiffness: 320, damping: 18 },
                      }
                }
                className="group h-full border border-[#C9A227]/18 bg-gradient-to-b from-[#24180F] to-[#1A120B] p-6 shadow-[0_0_0_rgba(0,0,0,0)] transition-shadow duration-500 hover:border-[#C9A227]/45 hover:shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
              >
                <p className="font-[family-name:var(--font-cormorant)] text-xs tracking-[0.28em] text-[#C9A227]/85 uppercase">
                  {item.en}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.18em] text-[#F5EFE6]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#F5EFE6]/68">{item.body}</p>
                <div className="mt-8 h-px w-10 bg-[#C9A227]/55 transition-all duration-500 group-hover:w-16" />
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
