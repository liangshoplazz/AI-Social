# Shoplazza AI Social

一个面向跨境电商与独立站品牌的 AI 社媒内容生成工具。

当前版本为 **MVP**，支持基于产品信息、目标市场、目标语言和参考图片，批量生成适用于不同平台的社媒文案与营销图片，并保存历史记录。

---

## 项目简介

Shoplazza AI Social 主要解决以下问题：

- 为跨境品牌批量生成社媒文案
- 支持多平台内容适配
- 支持多语言输出
- 支持参考产品图生成营销图片
- 支持历史记录查看
- 支持节假日 / 重点营销节点增强文案生成
- 支持基础免费版额度限制

---

## 当前功能（MVP）

### 1. 用户系统
- Supabase 注册 / 登录
- 邮箱验证
- 登录态控制
- 未登录用户访问 `/app` 会自动跳转到 `/login`

### 2. 社媒文案生成
- 基于 DeepSeek 生成帖子内容
- 支持平台：
  - Instagram
  - Facebook
  - X
  - Pinterest
- 支持语言：
  - English
  - French
  - German
  - Spanish
  - Japanese
- 自动按日期生成内容日历
- 自动去重，尽量避免内容重复
- 自动修正模型返回的日期格式

### 3. 节假日营销增强
- 集成 Nager.Date 公共节假日接口
- 自动获取目标市场对应节假日
- 重点识别营销节日，例如：
  - Black Friday
  - Cyber Monday
  - Christmas
  - Valentine’s Day
  - Mother’s Day
  - Father’s Day
  - Halloween
  - Thanksgiving
  - Singles’ Day
- 生成结果会优先考虑重要营销节点，增强节日营销场景

### 4. 图片生成
- 支持上传 1–3 张参考产品图
- 支持 removebg 处理
- 支持根据参考图生成产品营销图
- 支持同一天多个平台共用同一张图片
- 图片生成结果支持保存并回写历史记录

### 5. 历史记录
- 每次生成内容会写入 Supabase
- 支持查看历史 campaign
- 支持查看历史帖子内容
- 支持显示历史图片

### 6. 免费版限制
当前 MVP 免费版限制：
- 每日最多生成 **3 次帖子**
- 每日图片额度预留：**20**
- 单次最多选择：
  - **1 个月**
  - **每周 3 天**
  - **2 个平台**

---

## 技术栈

- **Next.js 16**
- **TypeScript**
- **Tailwind CSS**
- **Supabase**
  - Auth
  - Database
- **DeepSeek**
- **Ark / 图片生成接口**
- **Nager.Date Holiday API**

---

## 目录结构（核心）

```bash
src/
  app/
    api/
      generate/
      generate-image/
    app/
    login/
  components/
    app/
    auth/
    spg/
  lib/

**核心页面：**
	•	/ 首页
	•	/login 登录页
	•	/app 应用主页面

**核心接口：**
	•	src/app/api/generate/route.ts
	•	src/app/api/generate-image/route.ts

# 环境变量

请在项目根目录创建 .env 文件，并配置以下变量：
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=
DEEPSEEK_MODEL=

ARK_API_KEY=
ARK_BASE_URL=
ARK_IMAGE_MODEL=

REMOVE_BG_URL=


