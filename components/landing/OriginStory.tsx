"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { siteImages } from "@/lib/images";
import { Reveal } from "@/components/landing/Motion";

export default function OriginStory() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["-8%", "8%"]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    reduce ? [1, 1, 1, 1] : [0.55, 1, 1, 0.65]
  );

  return (
    <section
      id="origin"
      ref={ref}
      className="relative overflow-hidden border-y border-[#C9A227]/12 bg-[#140E09] py-24 md:py-32"
    >
      <div className="absolute inset-0 opacity-40">
        <motion.div style={{ y, opacity }} className="absolute inset-[-12%]">
          <Image
            src={siteImages.about}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#140E09] via-[#140E09]/88 to-[#140E09]/55" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-12 md:px-8">
        <Reveal className="md:col-span-5">
          <p className="font-[family-name:var(--font-cormorant)] text-sm tracking-[0.32em] text-[#C9A227] uppercase">
            Origin Story
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-noto-serif)] text-3xl tracking-[0.14em] text-[#F5EFE6] md:text-4xl">
            云雾高山 · 凤庆茶山
          </h2>
        </Reveal>

        <Reveal className="space-y-6 text-[#F5EFE6]/78 md:col-span-7 md:pt-10" delay={0.1}>
          <p className="text-base leading-8 md:text-lg">
            滇红发源于云南临沧凤庆。群山云雾、昼夜温差与高海拔慢生长，让茶树积累丰厚内含物质，成就滇红标志性的红亮汤色与金毫。
          </p>
          <p className="text-base leading-8 md:text-lg">
            1939 年，工夫红茶工艺在此成型。一芽一叶、一芽二叶经萎凋、揉捻、发酵与干燥，析出蜜香与花果香，汤感醇厚而不失层次。
          </p>
          <dl className="grid gap-4 border-t border-[#C9A227]/2 pt-6 sm:grid-cols-3">
            {[
              { dt: "海拔", dd: "约 1800m" },
              { dt: "产区", dd: "云南 · 凤庆" },
              { dt: "工艺", dd: "工夫红茶" },
            ].map((item) => (
              <div key={item.dt}>
                <dt className="text-xs tracking-[0.22em] text-[#C9A227]">{item.dt}</dt>
                <dd className="mt-2 font-[family-name:var(--font-noto-serif)] text-lg tracking-wider text-[#F5EFE6]">
                  {item.dd}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
