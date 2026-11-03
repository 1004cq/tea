import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import {
  formatOrderAmount,
  listOrdersForUser,
  orderStatusLabel,
} from "@/lib/orders";

export const metadata: Metadata = {
  title: "个人中心 Account",
  description: "Your Fengqing Dianhong account and PayPal orders.",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const { user } = session;
  const orders = await listOrdersForUser(user.id!);

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Account</p>
          <h1>个人中心</h1>
          <p className="muted page-lead">
            查看账户信息与 PayPal 支付订单。结账仍在产品页完成。
          </p>
          <p className="page-lead-en" lang="en">
            Profile and PayPal orders. Checkout remains on Products.
          </p>
        </div>

        <div className="account-card">
          <div className="account-identity">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={72}
                height={72}
                className="account-avatar"
                unoptimized
              />
            ) : (
              <div className="account-avatar account-avatar-fallback" aria-hidden>
                {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h2>{user.name || "茶友"}</h2>
              {user.email ? (
                <p className="muted" lang="en">
                  {user.email}
                </p>
              ) : null}
              <p className="account-provider">Signed in</p>
            </div>
          </div>

          <dl className="account-meta">
            <div>
              <dt>姓名 Name</dt>
              <dd>{user.name || "—"}</dd>
            </div>
            <div>
              <dt>邮箱 Email</dt>
              <dd>{user.email || "—"}</dd>
            </div>
          </dl>

          <div className="account-actions">
            <Link href="/products" className="btn btn-primary">
              Shop Tea · 选购
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="btn btn-ghost">
                Sign out · 退出
              </button>
            </form>
          </div>
        </div>

        <div className="orders-section">
          <div className="section-head compact">
            <p className="eyebrow">Orders</p>
            <h2>我的订单</h2>
            <p>登录后可见的 PayPal 支付记录。未登录无法查看。</p>
          </div>

          {orders.length === 0 ? (
            <p className="muted orders-empty">
              暂无订单。登录后在产品页完成 PayPal 支付，成功后会出现在这里。
            </p>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>商品</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>支付时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const status = orderStatusLabel(order.status);
                    return (
                      <tr key={order.id}>
                        <td>
                          <code className="order-id">{order.paypalOrderId}</code>
                        </td>
                        <td>{order.productName}</td>
                        <td>{formatOrderAmount(order)}</td>
                        <td>
                          <span
                            className={`order-status is-${order.status.toLowerCase()}`}
                          >
                            {status.zh}
                            <span lang="en"> · {status.en}</span>
                          </span>
                        </td>
                        <td>
                          {order.paidAt
                            ? new Intl.DateTimeFormat("zh-CN", {
                                timeZone: "Asia/Shanghai",
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(order.paidAt)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
