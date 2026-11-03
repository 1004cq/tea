import type { Metadata } from "next";
import Link from "next/link";

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
          <p className="contact-cta-wrap">
            <a className="btn btn-primary" href="mailto:hello@duojiayi.com">
              写信 · Email
            </a>
          </p>
        </div>

        <ul className="contact-list">
          <li>
            <strong>邮箱</strong>
            <a className="muted" href="mailto:hello@duojiayi.com">
              hello@duojiayi.com
            </a>
          </li>
          <li>
            <strong>客服时段</strong>
            <span className="muted">周一至周五 10:00 – 18:00（UTC+8）</span>
          </li>
          <li>
            <strong>选购</strong>
            <span className="muted">
              <Link href="/products">产品页</Link>
              支持 PayPal 与支付宝。登录后可在个人中心查看 PayPal 订单。
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
