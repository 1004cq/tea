import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/users";

export const runtime = "nodejs";

/**
 * POST /api/auth/register
 * Body: { email, password, name? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name : undefined;

    const user = await registerUser({ email, password, name });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REGISTER_FAILED";
    const map: Record<string, { status: number; error: string }> = {
      INVALID_EMAIL: { status: 400, error: "邮箱格式不正确" },
      WEAK_PASSWORD: { status: 400, error: "密码至少 8 位" },
      EMAIL_TAKEN: { status: 409, error: "该邮箱已注册，请直接登录" },
    };
    const mapped = map[code] || { status: 500, error: "注册失败，请稍后重试" };
    if (mapped.status >= 500) {
      console.error("[register]", error);
    }
    return NextResponse.json({ error: mapped.error }, { status: mapped.status });
  }
}
