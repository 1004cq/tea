"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { siteImages } from "@/lib/images";

function TeaLeafField() {
  const reduce = useReducedMotion();
  const leaves = [
    { left: "8%", delay: 0, duration: 18, size: 14 },
    { left: "22%", delay: 3, duration: 22, size: 10 },
    { left: "48%", delay: 1.5, duration: 20, size: 16 },
    { left: "68%", delay: 5, duration: 24, size: 11 },
    { left: "84%", delay: 2.2, duration: 19, size: 13 },
    { left: "35%", delay: 7, duration: 26, size: 9 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {leaves.map((leaf, i) => (
        <motion.span
          key={i}
          className="absolute top-[-10%] rounded-[40%_60%_55%_45%] bg-gradient-to-br from-[#C9A227]/55 to-[#8B3A3A]/35 opacity-40 blur-[0.3px]"
          style={{
            left: leaf.left,
            width: leaf.size,
            height: leaf.size * 1.6,
          }}
          animate={
            reduce
              ? undefined
              : {
                  y: ["0vh", "110vh"],
                  x: [0, i % 2 === 0 ? 18 : -22, 8],
                  rotate: [12, i % 2 === 0 ? 48 : -36, 20],
                  opacity: [0, 0.45, 0.35, 0],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: leaf.duration,
                  delay: leaf.delay,
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />
      ))}
      {/* soft liquor ripples */}
      {!reduce
        ? [0, 1, 2].map((i) => (
            <motion.span
              key={`ripple-${i}`}
              className="absolute left-1/2 top-[62%] h-40 w-40 -translate-x-1/2 rounded-full border border-[#C9A227]/25"
              animate={{
                scale: [0.6, 2.4],
                opacity: [0.35, 0],
              }}
              transition={{
                duration: 7,
                delay: i * 2.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))
        : null}
    </div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-20 pt-28 md:items-center md:pb-24 md:pt-24">
      <div className="absolute inset-0 -z-20">
        <Image
          src={siteImages.hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_38%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A120B]/92 via-[#1A120B]/72 to-[#1A120B]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A120B] via-[#1A120B]/25 to-[#1A120B]/45" />
      </div>

      {!reduce ? (
        <motion.div
          className="absolute inset-0 -z-10 scale-105"
          aria-hidden="true"
          animate={{ scale: [1.05, 1.12] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <Image
            src={siteImages.hero}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[center_38%] opacity-40 mix-blend-luminosity"
          />
        </motion.div>
      ) : null}

      <TeaLeafField />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="mb-5 font-[family-name:var(--font-cormorant)] text-sm tracking-[0.35em] text-[#C9A227] uppercase md:text-base">
            Fengqing · Yunnan
          </p>
          <h1 className="font-[family-name:var(--font-noto-serif)] text-4xl leading-[1.15] tracking-[0.18em] text-[#F5EFE6] sm:text-5xl md:text-6xl lg:text-7xl">
            滇红 · 金芽醇香
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#F5EFE6]/78 md:text-lg">
            云南凤庆高山工夫红茶。金毫显露，蜜香花香交织，汤感醇厚而悠长。
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#origin"
              className="inline-flex min-h-12 items-center justify-center border border-[#F5EFE6]/35 px-6 text-sm tracking-[0.18em] text-[#F5EFE6] transition hover:border-[#C9A227] hover:text-[#C9A227]"
            >
              了解滇红
            </a>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center bg-[#C9A227] px-6 text-sm tracking-[0.18em] text-[#1A120B] transition hover:bg-[#E0BE5A]"
            >
              立即选购
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
