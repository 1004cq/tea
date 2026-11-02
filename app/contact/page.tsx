import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系",
  description: "联系凤庆滇红团队。",
};

export default function ContactPage() {
  return (
    <section className="section" style={{ paddingTop: "3rem" }}>
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Contact</p>
          <h1>联系我们</h1>
          <p className="muted" style={{ maxWidth: "36rem" }}>
            订购咨询、批发合作或品鉴建议，欢迎通过以下方式联系。我们通常在 1–2
            个工作日内回复。
          </p>
        </div>

        <ul className="contact-list prose">
          <li>
            <strong>邮箱</strong>
            <span className="muted">hello@example.com</span>
          </li>
          <li>
            <strong>客服时段</strong>
            <span className="muted">周一至周五 10:00 – 18:00（UTC+8）</span>
          </li>
          <li>
            <strong>支付说明</strong>
            <span className="muted">
              本站使用 PayPal 收款。请在开发者后台配置 Client ID / Secret，并在
              Vercel 环境变量中填写后即可正式收款。
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
