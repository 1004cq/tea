"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/", label: "首页" },
  { href: "/products", label: "产品" },
  { href: "/about", label: "关于" },
  { href: "/contact", label: "联系" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const user = session?.user;
  const signedIn = status === "authenticated" && !!user;

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">凤庆滇红</span>
          <span className="brand-sub">Fengqing Dianhong</span>
        </Link>

        <ul className={`nav-links${open ? " open" : ""}`}>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-trailing">
          {signedIn ? (
            <Link
              href="/account"
              className="nav-auth-link nav-account"
              aria-current={pathname === "/account" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={22}
                  height={22}
                  className="nav-avatar"
                  unoptimized
                />
              ) : null}
              <span>个人中心</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="nav-auth-link"
              aria-current={pathname === "/login" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              登录
            </Link>
          )}

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-label="切换导航"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
