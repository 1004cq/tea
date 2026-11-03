import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import CredentialsAuthForm from "@/components/CredentialsAuthForm";

export const metadata: Metadata = {
  title: "登录 Login",
  description: "Sign in with email or Google to view your orders.",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl =
    params.callbackUrl && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "/account";

  if (session?.user) {
    redirect(callbackUrl);
  }

  const errorMessage =
    params.error === "OAuthAccountNotLinked"
      ? "该邮箱已通过其他方式关联，请使用原登录方式。"
      : params.error === "CredentialsSignin"
        ? "邮箱或密码错误。"
        : params.error
          ? "登录失败，请重试。"
          : null;

  return (
    <section className="section section-page">
      <div className="container auth-panel">
        <p className="eyebrow">Account</p>
        <h1>登录 Login</h1>
        <p className="muted page-lead">
          使用邮箱密码或 Google 登录，进入个人中心查看订单。PayPal /
          支付宝结账流程不变。
        </p>
        <p className="page-lead-en" lang="en">
          Email or Google sign-in. Checkout via PayPal / Alipay stays the same.
        </p>

        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <CredentialsAuthForm mode="login" callbackUrl={callbackUrl} />

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
            <GoogleMark />
            Continue with Google · 使用 Google 登录
          </button>
        </form>

        <p className="auth-switch muted">
          还没有账户？{" "}
          <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            注册 Register
          </Link>
        </p>
      </div>
    </section>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
