"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("请输入邮箱");
      return;
    }

    if (!password.trim()) {
      setError("请输入密码");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/app");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <a href="/" className="mb-8 flex items-center gap-3">
              <img src="/favicon.png" alt="logo" className="h-10 w-10 rounded" />
              <div>
                <div className="text-sm font-semibold">Shoplazza AI Social</div>
                <div className="text-xs text-slate-500">AI 社媒内容生成工具</div>
              </div>
            </a>

            <div className="max-w-xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                欢迎回来
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                登录你的工作台
              </h1>

              <p className="mt-5 text-base leading-7 text-slate-600">
                登录后即可继续生成多语言社媒文案，并基于参考图片生成匹配的产品视觉图。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-2xl font-semibold text-slate-950">登录</h2>
              <p className="mt-2 text-sm text-slate-500">输入邮箱和密码登录。</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "登录中..." : "登录"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                还没有账号？
                <a href="/register" className="ml-1 font-medium text-slate-900 hover:underline">
                  去注册
                </a>
              </div>

              <div className="mt-3 text-center text-sm text-slate-500">
                <a href="/" className="font-medium text-slate-900 hover:underline">
                  返回首页
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
