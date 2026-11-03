import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export const metadata: Metadata = {
  title: "个人中心 Account",
  description: "Your Fengqing Dianhong account.",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  const { user } = session;

  return (
    <section className="section section-page">
      <div className="container">
        <div className="page-hero">
          <p className="eyebrow">Account</p>
          <h1>个人中心</h1>
          <p className="muted page-lead">
            欢迎回来。可在此查看登录信息；选购与结账仍在产品页完成。
          </p>
          <p className="page-lead-en" lang="en">
            Welcome back. Browse and checkout on Products — PayPal / Alipay
            unchanged.
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
              <p className="account-provider">Signed in with Google</p>
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
      </div>
    </section>
  );
}
