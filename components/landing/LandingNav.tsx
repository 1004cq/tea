"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const links = [
  { href: "#origin", label: "产地" },
  { href: "#features", label: "特点" },
  { href: "#brew", label: "冲泡" },
  { href: "#collection", label: "系列" },
  { href: "#philosophy", label: "理念" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-500 ${
        scrolled || open
          ? "border-b border-[#C9A227]/20 bg-[#1A120B]/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-noto-serif)] text-lg tracking-[0.28em] text-[#F5EFE6] md:text-xl"
        >
          凤庆滇红
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="主导航">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm tracking-[0.18em] text-[#F5EFE6]/72 transition-colors hover:text-[#C9A227]"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/products"
            className="rounded-sm border border-[#C9A227]/55 px-4 py-2 text-sm tracking-[0.16em] text-[#C9A227] transition-colors hover:bg-[#C9A227]/12"
          >
            选购
          </Link>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-sm border border-[#F5EFE6]/18 text-[#F5EFE6] md:hidden"
          aria-expanded={open}
          aria-label="切换菜单"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-current transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1.5 h-px w-full bg-current transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute left-0 top-3 h-px w-full bg-current transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#C9A227]/15 bg-[#1A120B]/95 md:hidden"
            aria-label="移动导航"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="py-3 text-sm tracking-[0.18em] text-[#F5EFE6]/85"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/products"
                className="mt-2 border border-[#C9A227]/5 py-3 text-center text-sm tracking-[0.16em] text-[#C9A227]"
                onClick={() => setOpen(false)}
              >
                立即选购
              </Link>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
