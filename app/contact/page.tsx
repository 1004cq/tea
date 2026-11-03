import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系",
  description: "联系凤庆滇红团队。",
};

export default function ContactPage() {
  return (
    <section className="section section-page">
      <div className="container contact-layout">
        <div className="page-hero">
          <p className="eyebrow">Contact</p>
          <h1>联系我们</h1>
          <p className="muted page-lead">
            订购咨询、批发合作或品鉴建议，欢迎来信。我们通常在 1–2
            个工作日内回复。
          </p>
        </div>

        <ul className="contact-list">
          <li>
            <strong>邮箱</strong>
            <span className="muted">hello@duojiayi.com</span>
          </li>
          <li>
            <strong>客服时段</strong>
            <span className="muted">周一至周五 10:00 – 18:00（UTC+8）</span>
          </li>
          <li>
            <strong>支付说明</strong>
            <span className="muted">
              本站支持 PayPal（含 Apple Pay / Google Pay，视设备与浏览器而定）与支付宝网页支付。
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
