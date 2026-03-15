import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email || "").trim();
    const password = String(body?.password || "").trim();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "123456";

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });

    res.cookies.set("spg_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || "login failed") },
      { status: 500 }
    );
  }
}
