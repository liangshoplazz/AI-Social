import { NextResponse } from "next/server";
import { z } from "zod";
import type { FormState, GenerateResponse, GeneratedPost, Platform } from "@/lib/spg-types";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const MAX_UPLOAD_IMAGES = 3;
const MAX_ARK_IMAGES = 4;

/** ===== schema ===== */
const PlatformEnum = z.enum(["instagram", "facebook", "x", "pinterest"]);
const PostSchema = z.object({
  platform: PlatformEnum,
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().optional(),
  bodyText: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  imagePrompt: z.string().optional(),
});
const OutputSchema = z.object({ posts: z.array(PostSchema).min(1) });

/** ===== helpers ===== */
function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function addMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
function clampStr(s: string, max = 2200) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
function marketToCountryCode(market: string) {
  const m = (market || "").toUpperCase();
  const map: Record<string, string> = { US: "US", UK: "GB", FR: "FR", DE: "DE", ES: "ES", JP: "JP" };
  return map[m] || "US";
}
function extFromFile(file: File) {
  const name = file.name || "";
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  if (m?.[1]) return m[1].toLowerCase();
  const type = file.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("webp")) return "webp";
  return "png";
}
function mimeFromExt(ext: string) {
  const e = (ext || "").toLowerCase();
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "webp") return "image/webp";
  return "image/png";
}
function dataUrlFromBuffer(buf: Buffer, mime: string) {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

type Holiday = { date: string; localName?: string; name?: string };
const holidayCache = new Map<string, { ts: number; data: Holiday[] }>();

async function getHolidaysNager(countryCode: string, startISO: string, endISO: string) {
  const cacheKey = `${countryCode}:${startISO}:${endISO}`;
  const cached = holidayCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 6 * 60 * 60 * 1000) return cached.data;

  const startYear = Number(startISO.slice(0, 4));
  const endYear = Number(endISO.slice(0, 4));
  const years = startYear === endYear ? [startYear] : [startYear, endYear];

  const all: Holiday[] = [];
  for (const y of years) {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${y}/${countryCode}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      holidayCache.set(cacheKey, { ts: Date.now(), data: [] });
      return [];
    }
    const arr = (await resp.json()) as any[];
    for (const h of arr || []) {
      if (h?.date) all.push({ date: String(h.date), localName: h.localName, name: h.name });
    }
  }

  const data = all.filter((h) => h.date >= startISO && h.date <= endISO).sort((a, b) => a.date.localeCompare(b.date));
  holidayCache.set(cacheKey, { ts: Date.now(), data });
  return data;
}

function pickHashtags(industry: string) {
  const base = ["wellness", "selfcare", "dailyhabits", "shoponline"];
  const map: Record<string, string[]> = {
    "保健品": ["supplements", "coq10", "hearthealth", "energyboost"],
    "护肤": ["skincare", "glowingskin", "beautyroutine", "cleanbeauty"],
    "美容": ["beauty", "beautytips", "musthave", "routine"],
    "时尚": ["style", "outfit", "streetstyle", "wardrobe"],
    "电子产品": ["tech", "gadgets", "smartlife", "innovation"],
    "家居": ["homedecor", "cozyhome", "interior", "homeideas"],
    "宠物": ["petlove", "petcare", "catlife", "doglife"],
    "运动健身": ["fitness", "workout", "training", "fitlife"],
  };
  return [...base, ...(map[industry] || [])].slice(0, 10);
}

function buildImagePrompt(state: FormState, platform: Platform) {
  if (!state.useImage) return undefined;
  const ratio =
    platform === "instagram" ? "1:1" :
    platform === "pinterest" ? "2:3" :
    platform === "facebook" ? "4:5" :
    "16:9";

  return `Create a marketing image for "${state.productName}".
Style: ${state.imageStyle}. Tone: ${state.tone}. Audience: ${state.audience}. Industry: ${state.industry}.
Composition: premium DTC ad, clean layout, strong focal product, readable negative space, no excessive text.
Aspect ratio: ${ratio}.`;
}

function styleSuffix(imageStyle: string) {
  const map: Record<string, string> = {
    "自然真实(生活方式)": "Lifestyle, candid real-life scene, natural daylight, human touch, authentic, not overly staged.",
    "高端质感": "Premium, refined materials, editorial lighting, subtle shadows, luxury product photography.",
    "(暗调奢华)": "Low-key luxury, dark moody background, rim light, glossy highlights, cinematic contrast.",
    "明亮电商(干净棚拍)": "High-key studio lighting, clean backdrop, crisp details, e-commerce style, minimal clutter.",
    "科技感(冷色未来)": "Cool tones, futuristic, neon accents, metallic textures, clean tech aesthetic.",
    "清新自然(植物光感)": "Fresh, airy, botanical elements, soft green highlights, gentle sunlight, clean wellness vibe.",
    "运动能量(动感硬朗)": "Dynamic composition, bold angles, energetic mood, sporty textures, punchy contrast.",
    "可爱卡通(软萌插画)": "Cute, soft illustration style, rounded shapes, playful, friendly color mood.",
    "极简留白(高级排版)": "Minimal layout, lots of negative space, modern design grid, premium composition.",
  };
  return map[imageStyle] || "Premium DTC aesthetic, clean composition, modern lighting.";
}

/** ===== DeepSeek ===== */
function buildSystemPrompt() {
  return `
You are a senior social media copywriter for cross-border DTC brands (Shopify sellers).
Return ONLY valid JSON. No markdown. No extra text.
Schema: { "posts": [ { "platform": "...", "scheduledDate": "YYYY-MM-DD", "title"?, "bodyText": "...", "hashtags": ["..."], "imagePrompt"? } ] }
Rules:
- scheduledDate must be within date range.
- Platform styles:
  - instagram: longer caption ok, line breaks, friendly CTA, emojis allowed.
  - facebook: informative, trust-building, clear CTA.
  - x: concise, punchy, ideally <= 240 chars.
  - pinterest: benefit-led, save-worthy, include helpful title sometimes.
- If needHashtags=false => [].
- If useImage=false => omit imagePrompt.
- If useImage=true => provide imagePrompt per post (short but specific).
Holiday usage: natural, not forced.
Safety: avoid medical claims/guarantees for supplements/skincare. Use compliant language like "supports", "may", "daily routine".
`;
}

function buildUserPrompt(state: FormState, startISO: string, endISO: string, holidays: Holiday[]) {
  const holidayText =
    holidays.length === 0
      ? "No holiday data available."
      : holidays.slice(0, 25).map((h) => `- ${h.date}: ${h.name || h.localName || "Holiday"}`).join("\n");

  return `
Generate a social posting plan.
Inputs:
- platforms: ${JSON.stringify(state.platforms)}
- market: ${state.market} (countryCode=${marketToCountryCode(state.market)})
- language: ${state.language}
- tone: ${state.tone}
- audience: ${state.audience}
- industry: ${state.industry}
- productName: ${state.productName}
- keySellingPoints: ${clampStr(state.keySellingPoints, 1200)}
- needHashtags: ${state.needHashtags}
- useImage: ${state.useImage}
- imageStyle: ${state.useImage ? state.imageStyle : "N/A"}
- schedule: ${state.postsPerWeek} posts/week
- duration: ${state.months} months
- date range: ${startISO} to ${endISO}

Public holidays within date range (optional hooks):
${holidayText}

Requirements:
- Distribute dates naturally across weeks.
- Output in selected language only.
- Return ONLY JSON.
`;
}

async function callDeepSeek(system: string, user: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY");

  const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`DeepSeek API error: ${resp.status} ${text}`);
  const data = JSON.parse(text);
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("DeepSeek: empty content");
  return content;
}

/** ===== storage ===== */
async function ensureDir(rel: "uploads" | "cutouts") {
  const dir = path.join(process.cwd(), "public", rel);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function saveUploadedFiles(files: File[]) {
  const dir = await ensureDir("uploads");
  const saved: { url: string; filename: string; ext: string; mime: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = extFromFile(f);
    const mime = f.type || mimeFromExt(ext);
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${i}.${ext}`;
    await fs.writeFile(path.join(dir, filename), buf);
    saved.push({ url: `/uploads/${filename}`, filename, ext, mime });
  }
  return saved;
}

/** ===== removebg (raw body) ===== */
async function removeBgRaw(input: Buffer, inputMime: string) {
  const url = process.env.REMOVE_BG_URL;
  if (!url) throw new Error("REMOVE_BG_URL not set");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": inputMime || "application/octet-stream" },
    body: input,
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`removebg_raw failed: ${resp.status} ${t.slice(0, 200)}`);
  }
  const arr = new Uint8Array(await resp.arrayBuffer());
  return Buffer.from(arr); // png bytes
}

async function removeBgAndSave(savedUploads: { filename: string; ext: string; mime: string }[]) {
  const cutDir = await ensureDir("cutouts");
  const out: { url: string; filename: string; mime: string }[] = [];
  for (let i = 0; i < savedUploads.length; i++) {
    const up = savedUploads[i];
    const uploadPath = path.join(process.cwd(), "public", "uploads", up.filename);
    const buffer = await fs.readFile(uploadPath);

    const png = await removeBgRaw(buffer, up.mime || mimeFromExt(up.ext));
    const outName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${i}-cut.png`;
    await fs.writeFile(path.join(cutDir, outName), png);
    out.push({ url: `/cutouts/${outName}`, filename: outName, mime: "image/png" });
  }
  return out;
}

/** ===== Ark Seedream (base64 data-url image) ===== */
async function arkGenerateImage(params: {
  prompt: string;
  image?: string | string[]; // data-url or array of data-url
  size?: "1K" | "2K" | "adaptive";
  watermark?: boolean;
  sequential?: "disabled" | "auto";
  maxImages?: number;
  stream?: boolean;
}) {
  const baseUrl = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_IMAGE_MODEL || "doubao-seedream-5-0-260128";
  if (!apiKey) throw new Error("Missing ARK_API_KEY");

  const body: any = {
    model,
    prompt: params.prompt,
    response_format: "url",
    size: params.size ?? "2K",
    stream: params.stream ?? false,
    watermark: params.watermark ?? false,
    sequential_image_generation: params.sequential ?? "disabled",
  };
  if (params.image) body.image = params.image;
  if (params.sequential === "auto") {
    body.sequential_image_generation_options = { max_images: params.maxImages ?? 4 };
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Ark error ${res.status}: ${text.slice(0, 400)}`);

  const json = JSON.parse(text) as any;
  const url = json?.data?.[0]?.url;
  if (!url) throw new Error(`Ark response missing url: ${text.slice(0, 400)}`);
  return url as string;
}

/** ===== mock fallback ===== */
function buildMockPlan(state: FormState, start: Date, end: Date, warning?: string) {
  const startISO = toISODate(start);
  const endISO = toISODate(end);
  const hashtags = state.needHashtags ? pickHashtags(state.industry) : [];

  const posts: GeneratedPost[] = state.platforms.map((p, idx) => ({
    id: `mock-${p}-${idx}`,
    platform: p,
    scheduledDate: toISODate(start),
    title: undefined,
    bodyText: `${state.productName}\n\n${clampStr(state.keySellingPoints, 500)}`,
    hashtags,
    imagePrompt: state.useImage ? buildImagePrompt(state, p as Platform) : undefined,
    imageUrl: undefined,
  }));

  const res: any = { taskId: `mock_${Date.now()}`, startDate: startISO, endDate: endISO, posts };
  if (warning) res.warning = warning;
  return res as GenerateResponse & { warning?: string };
}

/** ===== main ===== */
export async function POST(req: Request) {
  const start = new Date();
  const end = addMonths(start, 1);

  let state: FormState;
  let uploadedFiles: File[] = [];
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const payload = form.get("payload");
    state = JSON.parse(String(payload || "{}")) as FormState;
    uploadedFiles = (form.getAll("images") as unknown as File[]) || [];
  } else {
    state = (await req.json()) as FormState;
  }

  const endReal = addMonths(start, state.months);
  const startISO = toISODate(start);
  const endISO = toISODate(endReal);

  const countryCode = marketToCountryCode(state.market);
  const holidays = await getHolidaysNager(countryCode, startISO, endISO);

  // save uploads
  const savedUploads = await saveUploadedFiles(uploadedFiles.slice(0, MAX_UPLOAD_IMAGES));

  // removebg -> cutouts (optional)
  let warning: string | undefined;
  let refBuffers: Buffer[] = [];
  let refMime = "image/png";

  if (state.useImage && savedUploads.length) {
    try {
      // try removebg
      if (process.env.REMOVE_BG_URL) {
        const cutouts = await removeBgAndSave(savedUploads);
        // read cutouts back as buffers for base64
        for (const c of cutouts) {
          const fp = path.join(process.cwd(), "public", "cutouts", c.filename);
          refBuffers.push(await fs.readFile(fp));
        }
        refMime = "image/png";
      } else {
        throw new Error("REMOVE_BG_URL not set");
      }
    } catch (e: any) {
      warning = `removebg 失败，已使用原图继续。原因：${String(e?.message || e).slice(0, 180)}`;
      // fallback to original upload buffers
      for (const up of savedUploads) {
        const fp = path.join(process.cwd(), "public", "uploads", up.filename);
        refBuffers.push(await fs.readFile(fp));
        refMime = up.mime || mimeFromExt(up.ext);
      }
    }
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(buildMockPlan(state, start, endReal, "未配置 DeepSeek Key，已使用 Mock 生成。"));
  }

  try {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(state, startISO, endISO, holidays);
    const raw = await callDeepSeek(system, user);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Model returned non-JSON content: ${raw.slice(0, 200)}`);
    }
    const out = OutputSchema.parse(parsed);

    const suffix = styleSuffix(state.imageStyle);
    const refDataUrls = refBuffers.map((b) => dataUrlFromBuffer(b, refMime));

    const posts = await Promise.all(out.posts.map(async (p, idx) => {
      const basePrompt = state.useImage ? (p.imagePrompt || buildImagePrompt(state, p.platform as Platform) || "") : undefined;
      const finalPrompt = state.useImage && basePrompt
        ? `${basePrompt}\n\nStyle hints: ${suffix}\n\nRules: keep product clear, avoid heavy text overlay.`
        : undefined;

      let imageUrl: string | undefined;

      if (state.useImage && refDataUrls.length) {
        // 默认占位：用你站内的原图 url（前端有图），但 Ark 成功后会覆盖为 volces url
        imageUrl = savedUploads[0]?.url ? (process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL}${savedUploads[0].url}` : savedUploads[0].url) : undefined;

        // 只有前 MAX_ARK_IMAGES 张真调用 Ark
        if (process.env.ARK_API_KEY && idx < MAX_ARK_IMAGES) {
          try {
            const oneRef = refDataUrls[idx % refDataUrls.length];
            imageUrl = await arkGenerateImage({
              prompt: finalPrompt || `Create a premium marketing image for ${state.productName}. ${suffix}`,
              image: oneRef, // ✅ data-url base64，彻底避免 Ark 下载你域名
              size: "2K",
              watermark: false,
              sequential: "disabled",
              stream: false,
            });
          } catch (e: any) {
            warning = (warning ? warning + "；" : "") + `Ark 生成失败，已回退为占位图。原因：${String(e?.message || e).slice(0, 180)}`;
          }
        } else if (!process.env.ARK_API_KEY) {
          warning = (warning ? warning + "；" : "") + "未配置 ARK_API_KEY：图片将仅使用占位图。";
        }
      } else if (state.useImage) {
        warning = (warning ? warning + "；" : "") + "你勾选了“同时生成图片”，但没有上传图片：目前仅生成 imagePrompt。";
      }

      return {
        id: `${p.platform}-${p.scheduledDate}-${idx}`,
        platform: p.platform as Platform,
        scheduledDate: p.scheduledDate,
        title: p.title,
        bodyText: p.bodyText,
        hashtags: p.hashtags,
        imagePrompt: state.useImage ? finalPrompt : undefined,
        imageUrl,
      } as GeneratedPost;
    }));

    const res: GenerateResponse = {
      taskId: `ds_${Date.now()}`,
      startDate: startISO,
      endDate: endISO,
      posts,
    };

    return NextResponse.json(warning ? ({ ...res, warning } as any) : res);
  } catch (e: any) {
    const msg = String(e?.message || "DeepSeek failed");
    const w =
      msg.includes("402") || msg.toLowerCase().includes("insufficient balance")
        ? "DeepSeek 余额不足（402），已自动使用 Mock 生成。"
        : `DeepSeek 调用失败，已自动使用 Mock 生成。原因：${msg.slice(0, 180)}`;
    return NextResponse.json(buildMockPlan(state, start, endReal, warning ? `${w}；${warning}` : w));
  }
}
