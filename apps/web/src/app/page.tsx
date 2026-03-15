import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data.user;

  const features = [
    {
      title: "多语言社媒文案生成",
      desc: "支持英语、法语、德语、西班牙语、日语等市场内容输出，适合跨境电商和独立站品牌。",
    },
    {
      title: "多平台内容适配",
      desc: "自动生成适用于 Instagram、Facebook、X、Pinterest 的文案结构和内容风格。",
    },
    {
      title: "参考图驱动的产品视觉图",
      desc: "上传你的产品参考图，基于真实产品形态生成匹配的社媒视觉图片，减少跑偏。",
    },
    {
      title: "同日多平台图片共用",
      desc: "同一天计划发布的多个平台帖子可以共用同一张生成图片，提升效率并保持一致性。",
    },
    {
      title: "适合电商品牌团队",
      desc: "适用于保健品、护肤、美妆、DTC 品牌和小型运营团队，减少内容生产时间。",
    },
    {
      title: "生成结果可直接预览",
      desc: "支持在系统中直接按月份、按平台预览生成内容，更方便检查和调整。",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "填写产品信息",
      desc: "输入产品名称、卖点、受众、目标市场、输出语言，并设置发帖频率与月份范围。",
    },
    {
      step: "02",
      title: "上传参考图片",
      desc: "上传 1–3 张产品参考图，系统会基于你的真实产品形态生成社媒视觉图。",
    },
    {
      step: "03",
      title: "生成文案与图片",
      desc: "自动生成多平台社媒文案、图片提示词，并按需生成匹配的产品视觉图。",
    },
  ];

  const useCases = [
    "保健品品牌社媒内容批量生产",
    "护肤/美妆产品海外市场内容生成",
    "独立站品牌内容日历规划",
    "运营团队快速生成平台适配文案",
  ];

  const faqs = [
    {
      q: "这个工具适合谁使用？",
      a: "适合跨境电商卖家、独立站品牌、DTC 团队、内容运营和小型营销团队，尤其适合需要批量生成多语言社媒内容的品牌。",
    },
    {
      q: "支持哪些平台？",
      a: "当前支持 Instagram、Facebook、X 和 Pinterest。",
    },
    {
      q: "支持哪些语言？",
      a: "支持英语、法语、德语、西班牙语和日语。",
    },
    {
      q: "可以使用我自己的产品图片吗？",
      a: "可以。你可以上传 1–3 张参考图片，系统会基于这些图片生成更符合你产品形态的视觉内容。",
    },
    {
      q: "是不是每个平台都要单独生成图片？",
      a: "不一定。系统支持同一天多个平台共用同一张图片，减少重复生成。",
    },
    {
      q: "这是一个展示站还是一个可用工具？",
      a: "它是一个可直接使用的 AI 社媒内容生成工具，首页是展示页，实际功能在 /app 页面中使用。",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <img src="/favicon.png" alt="logo" className="h-8 w-8 rounded" />
            <div>
              <div className="text-sm font-semibold">Shoplazza AI Social</div>
              <div className="text-xs text-slate-500">AI 社媒内容生成工具</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">
              功能亮点
            </a>
            <a href="#how" className="transition hover:text-slate-900">
              使用流程
            </a>
            <a href="#faq" className="transition hover:text-slate-900">
              常见问题
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <LogoutButton className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:inline-flex" />
            ) : (
              <a
                href="/login"
                className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
              >
                登录
              </a>
            )}

            <a
              href="/app"
              className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              打开工具
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              面向跨境电商与独立站品牌
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              用 AI 批量生成社媒文案和产品视觉图
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              输入产品信息，上传参考图片，即可自动生成适用于 Instagram、Facebook、X、Pinterest
              的多语言社媒内容，并按需生成匹配的产品视觉图。
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/app"
                className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                立即开始
              </a>
              <a
                href="#how"
                className="inline-flex rounded-2xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                查看流程
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <div>多语言输出</div>
              <div>参考图驱动生成</div>
              <div>平台内容适配</div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Campaign Preview</div>
                    <div className="text-xs text-slate-500">内容生成 + 图片生成</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    AI Workflow
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      输入
                    </div>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">产品名称</div>
                        <div className="mt-1 font-medium">D3K2 Capsules</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">目标市场</div>
                        <div className="mt-1 font-medium">Germany</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">输出语言</div>
                        <div className="mt-1 font-medium">German</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      输出
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 text-xs text-slate-500">Instagram / Facebook</div>
                        <div className="h-24 rounded-lg bg-slate-100" />
                        <div className="mt-3 text-sm text-slate-700">
                          自动生成平台适配文案、Hashtags 和图片提示词
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 text-xs text-slate-500">Visual Output</div>
                        <div className="text-sm text-slate-700">
                          基于参考产品图生成场景图，并支持同日多平台共用
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {useCases.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-slate-500">使用流程</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              从产品信息到社媒内容，一套流程完成
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              适合需要快速生产内容、同时保持产品一致性的品牌和运营团队。
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-400">{item.step}</div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-slate-500">功能亮点</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              为跨境电商内容生产而设计
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-sm font-semibold text-slate-500">结果展示</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                保持产品一致性，同时提升内容生产效率
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-600">
                上传产品参考图后，系统会围绕真实产品形态生成社媒视觉图，并为不同平台自动适配文案，减少内容制作时间。
              </p>

              <ul className="mt-8 space-y-4 text-sm text-slate-700">
                <li>• 同一天多个平台可共用同一张图片</li>
                <li>• 降低文案和视觉生产成本</li>
                <li>• 更适合品牌持续做社媒内容日历</li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-xs font-medium text-slate-500">Instagram Preview</div>
                <div className="h-56 rounded-2xl bg-slate-100" />
                <div className="mt-3 text-sm text-slate-600">生活方式风格社媒内容预览</div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-xs font-medium text-slate-500">Pinterest Preview</div>
                <div className="h-56 rounded-2xl bg-slate-100" />
                <div className="mt-3 text-sm text-slate-600">平台适配的图片与内容预览</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-500">常见问题</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              你可能想了解
            </h2>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-base font-semibold text-slate-900">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-slate-500">为什么使用 AI</div>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              内容生产效率提升
            </h2>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">传统内容生产</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>写文案需要人工研究市场</li>
                <li>不同平台需要改写内容</li>
                <li>设计图片需要额外时间</li>
                <li>社媒排期管理困难</li>
                <li>内容生产效率低</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8">
              <h3 className="mb-4 text-xl font-semibold text-slate-900">Shoplazza AI Social</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>AI 自动生成平台适配文案</li>
                <li>支持多语言市场</li>
                <li>自动生成产品视觉图</li>
                <li>按月生成内容日历</li>
                <li>运营效率提升 10x</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            开始用 AI 提升你的社媒内容效率
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
            几分钟内生成多语言社媒文案和匹配产品图，帮助品牌更快进入内容生产状态。
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/app"
              className="inline-flex rounded-2xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              打开工具
            </a>

            {isLoggedIn ? (
              <LogoutButton className="inline-flex rounded-2xl border border-slate-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-900 disabled:opacity-60" />
            ) : (
              <a
                href="/login"
                className="inline-flex rounded-2xl border border-slate-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-900"
              >
                登录
              </a>
            )}
          </div>
        </div>
      </section>

<footer className="border-t border-slate-200 bg-white">
  <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
    <div className="flex flex-col justify-between gap-6 md:flex-row">
      <div>
        <div className="flex items-center gap-2">
          <img src="/favicon.png" className="h-6 w-6" alt="logo" />
          <span className="font-semibold text-slate-900">Shoplazza AI Social</span>
        </div>

        <p className="mt-3 max-w-sm text-sm text-slate-500">
          AI 社媒内容生成工具，帮助跨境品牌快速生成多平台营销内容。
        </p>
      </div>

      <div className="text-sm">
        <div className="mb-3 font-semibold">产品</div>
        <div className="space-y-2 text-slate-600">
          <div><a href="/app">内容生成器</a></div>
          {isLoggedIn ? (
            <div>
              <LogoutButton className="text-sm text-slate-600 hover:text-slate-900" />
            </div>
          ) : (
            <div><a href="/login">登录</a></div>
          )}
        </div>
      </div>
    </div>

    <div className="mt-10 text-center text-xs text-slate-400">
      © 2026 Shoplazza AI Social. All rights reserved.
    </div>
  </div>
</footer>
    </main>
  );
}
