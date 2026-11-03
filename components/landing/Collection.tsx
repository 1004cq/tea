"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { getCatalogProducts } from "@/lib/products";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/Motion";

const featuredIds = ["dianhong-classic", "golden-needle", "gift-set"] as const;

export default function Collection() {
  const reduce = useReducedMotion();
  const catalog = getCatalogProducts();
  const items = featuredIds
    .map((id) => catalog.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <section id="collection" className="bg-[#1A120B] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-cormorant)] text-sm tracking-[0.32em] text-[#C9A227] uppercase">
              Collection
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-noto-serif)] text-3xl tracking-[0.14em] text-[#F5EFE6] md:text-4xl">
              产品系列
            </h2>
            <p className="mt-4 text-[#F5EFE6]/7">
              经典、金芽与礼盒。PayPal 收美元，支付宝收人民币。
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm tracking-[0.18em] text-[#C9A227] transition hover:text-[#E0BE5A]"
          >
            查看全部 →
          </Link>
        </Reveal>

        <Stagger className="mt-14 grid gap-8 lg:grid-cols-3">
          {items.map((product) => {
            if (!product) return null;
            return (
              <StaggerItem key={product.id}>
                <motion.article
                  whileHover={
                    reduce
                      ? undefined
                      : {
                          y: -6,
                          transition: { type: "spring", stiffness: 280, damping: 20 },
                        }
                  }
                  className="group overflow-hidden border border-[#C9A227]/16 bg-[#140E09]"
                >
                  <Link
                    href={`/products#${product.id}`}
                    className="relative block aspect-[4/3] overflow-hidden"
                  >
                    <Image
                      src={product.image}
                      alt={`${product.name} / ${product.nameEn}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#140E09] via-transparent to-transparent opacity-80" />
                  </Link>
                  <div className="space-y-3 p-6">
                    <p className="text-xs tracking-[0.22em] text-[#C9A227]">
                      {product.grade} · {product.weight}
                    </p>
                    <h3 className="font-[family-name:var(--font-noto-serif)] text-2xl tracking-[0.14em] text-[#F5EFE6]">
                      {product.name}
                    </h3>
                    <p className="text-sm leading-7 text-[#F5EFE6]/65">
                      {product.description}
                    </p>
                    <div className="flex items-baseline gap-3 pt-2">
                      <span className="font-[family-name:var(--font-cormorant)] text-2xl text-[#C9A227]">
                        ¥{product.priceCny.toFixed(0)}
                      </span>
                      <span className="text-sm text-[#F5EFE6]/45">
                        USD {product.price.toFixed(2)}
                      </span>
                    </div>
                    <Link
                      href={`/products#${product.id}`}
                      className="mt-2 inline-flex min-h-11 items-center justify-center border border-[#C9A227]/5 px-5 text-sm tracking-[0.16em] text-[#C9A227] transition hover:bg-[#C9A227] hover:text-[#1A120B]"
                    >
                      选购 · Shop
                    </Link>
                  </div>
                </motion.article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
