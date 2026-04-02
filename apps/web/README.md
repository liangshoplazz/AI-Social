# 🚀 AI Social Post Generator (SPG)

一个基于 Next.js + Supabase + DeepSeek 的 AI
社媒内容生成平台，帮助跨境电商 / DTC
品牌自动生成多平台营销内容（Instagram / Facebook / X / Pinterest）。

------------------------------------------------------------------------

## 📌 项目简介

AI Social Post Generator（简称 SPG）是一个用于生成社交媒体营销内容的
SaaS 工具，支持：

-   自动生成多平台社媒文案
-   支持营销节日自动结合
-   支持图片生成 Prompt
-   支持用户注册登录（Supabase Auth）
-   支持生成记录存储
-   支持每日配额限制（MVP版）

适用于 Shopify 卖家、独立站卖家、跨境电商团队。

------------------------------------------------------------------------

## ✨ 核心功能

### 🧠 AI 内容生成

-   基于 DeepSeek API
-   自动生成多平台内容
-   支持不同语气、受众、行业

### 📅 智能排期

-   自动生成发帖日期
-   按周频率分配
-   自动对齐营销节日

### 🖼 图片 Prompt 生成

-   自动生成广告图提示词
-   支持多种风格（高级感 / 电商风 / 科技感等）

### 👤 用户系统

-   注册 / 登录（Supabase Auth）
-   邮箱验证
-   用户数据隔离

### 📊 数据存储

-   campaigns（生成任务）
-   generated_posts（生成内容）
-   profiles（用户配额）

### 🚫 配额限制（MVP）

-   每日生成次数限制
-   免费版限制：
    -   最多 1 个月
    -   每周最多 3 篇
    -   最多 2 个平台

------------------------------------------------------------------------

## 🏗 技术栈

-   Frontend: Next.js 16 (App Router)
-   Backend: Next.js API Routes
-   AI: DeepSeek API
-   Database: Supabase (Postgres)
-   Auth: Supabase Auth
-   Storage: 本地文件系统（MVP）
-   Process Manager: PM2

------------------------------------------------------------------------

## 📁 项目结构

    social-post-gen/
    ├── apps/
    │   └── web/
    │       ├── src/
    │       │   ├── app/
    │       │   │   ├── api/
    │       │   │   │   ├── generate/
    │       │   │   │   ├── auth/
    │       │   │   │   └── ...
    │       │   │   ├── login/
    │       │   │   ├── register/
    │       │   │   └── app/
    │       │   ├── components/
    │       │   └── lib/
    │       ├── public/
    │       └── package.json
    └── README.md

------------------------------------------------------------------------

## ⚙️ 环境变量配置

在 `apps/web/.env` 中配置：

    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

    DEEPSEEK_API_KEY=
    DEEPSEEK_BASE_URL=https://api.deepseek.com

    REMOVE_BG_URL=
    NEXT_PUBLIC_SITE_URL=https://your-domain.com

------------------------------------------------------------------------

## 🚀 本地开发

    cd apps/web
    npm install
    npm run dev

------------------------------------------------------------------------

## 🏭 生产部署

    npm run build
    pm2 start ecosystem.config.cjs

------------------------------------------------------------------------

## 🔐 邮箱验证问题说明

如果验证链接跳转到 `0.0.0.0`：

请检查：

1.  Supabase Dashboard → Auth → URL Configuration\
2.  Site URL 设置为你的域名\
3.  Redirect URLs 添加：
    -   https://your-domain.com/auth/confirm
    -   https://your-domain.com/login

------------------------------------------------------------------------

## ⚠️ 常见问题

### ❗ email rate limit exceeded

-   Supabase 默认限制邮件发送频率
-   解决方案：
    -   等待冷却
    -   升级 Supabase
    -   使用自定义 SMTP

------------------------------------------------------------------------

## 🧩 API 说明

### POST /api/generate

生成社媒内容

**请求参数：**

    FormState

**返回：**

    GenerateResponse

------------------------------------------------------------------------

## 📌 Roadmap

-   [ ] Stripe 付费系统
-   [ ] 多用户团队
-   [ ] SaaS Dashboard
-   [ ] 图片生成（SD / Midjourney）
-   [ ] 多语言 UI
-   [ ] 历史记录 UI 优化

------------------------------------------------------------------------

## 📄 License

MIT License

------------------------------------------------------------------------

## 👨‍💻 作者

-   Summer, Leon

------------------------------------------------------------------------

## ⭐️ Star 支持

如果这个项目对你有帮助，欢迎点个 Star ⭐
