import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">凤庆滇红</div>
          <p className="muted">
            源自云南凤庆高山茶园，以工夫红茶工艺呈现滇红的蜜香与醇厚。
          </p>
        </div>

        <div>
          <div className="footer-title">导航</div>
          <ul className="footer-links">
            <li>
              <Link href="/">首页</Link>
            </li>
            <li>
              <Link href="/products">产品</Link>
            </li>
            <li>
              <Link href="/about">关于</Link>
            </li>
            <li>
              <Link href="/contact">联系</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="footer-title">品鉴</div>
          <ul className="footer-links">
            <li>水温 90–95°C</li>
            <li>茶水比约 1:30</li>
            <li>可多次冲泡</li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {year} 凤庆滇红</span>
        <span>Payments secured by PayPal</span>
      </div>
    </footer>
  );
}
