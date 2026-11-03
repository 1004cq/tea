import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import CredentialsAuthForm from "@/components/CredentialsAuthForm";

export const metadata: Metadata = {
  title: "注册 Register",
  description: "Create a Fengqing Dianhong account with email and password.",
};

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "/account";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <section className="section section-page">
      <div className="container auth-panel">
        <p className="eyebrow">Account</p>
        <h1>注册 Register</h1>
        <p className="muted page-lead">
          创建账户后可在个人中心查看 PayPal 支付订单。也可使用 Google 一键登录。
        </p>
        <p className="page-lead-en" lang="en">
          Register with email to track PayPal orders in your account.
        </p>

        <CredentialsAuthForm mode="register" callbackUrl={callbackUrl} />

        <div className="auth-divider">
          <span>或 or</span>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="btn btn-google">
            Continue with Google · 使用 Google 注册/登录
          </button>
        </form>

        <p className="auth-switch muted">
          已有账户？{" "}
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            登录 Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
