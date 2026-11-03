import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-[#C9A227]/15 bg-[#0E0A07]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-[family-name:var(--font-noto-serif)] text-xl tracking-[0.28em] text-[#F5EFE6]">
            凤庆滇红
          </p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-[#F5EFE6]/55">
            云南凤庆高山工夫红茶。金芽 · 蜜香 · 醇厚。
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.24em] text-[#C9A227]">导航</p>
          <ul className="mt-4 space-y-2 text-sm text-[#F5EFE6]/7">
            <li>
              <a href="#origin" className="hover:text-[#C9A227]">
                产地故事
              </a>
            </li>
            <li>
              <Link href="/products" className="hover:text-[#C9A227]">
                产品系列
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#C9A227]">
                关于我们
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-[#C9A227]">
                登录
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.24em] text-[#C9A227]">联系</p>
          <ul className="mt-4 space-y-2 text-sm text-[#F5EFE6]/7">
            <li>
              <a href="mailto:hello@duojiayi.com" className="hover:text-[#C9A227]">
                hello@duojiayi.com
              </a>
            </li>
            <li>PayPal · 支付宝</li>
            <li>周一至周五 10:00–18:00（UTC+8）</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#C9A227]/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs tracking-wider text-[#F5EFE6]/4 md:flex-row md:items-center md:justify-between md:px-8">
          <span>© {new Date().getFullYear()} 凤庆滇红</span>
          <span className="font-[family-name:var(--font-cormorant)] tracking-[0.2em]">
            Dianhong · Golden Tips · Yunnan
          </span>
        </div>
      </div>
    </footer>
  );
}
