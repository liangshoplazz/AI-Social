import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  FormState,
  GenerateResponse,
  GeneratedPost,
  Platform,
} from "@/lib/spg-types";
import path from "path";
import { promises as fs } from "fs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const DAILY_POST_LIMIT = 3;
const DAILY_IMAGE_LIMIT = 20;
const FREE_MAX_MONTHS = 1;
const FREE_MAX_POSTS_PER_WEEK = 3;
const FREE_MAX_PLATFORMS = 2;
const MAX_UPLOAD_IMAGES = 3;

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

async function getOrCreateProfile(supabase: any, userId: string) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("user_id, daily_post_count, daily_image_count, last_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const today = new Date().toISOString().slice(0, 10);

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      daily_post_count: 0,
      daily_image_count: 0,
      last_reset_date: today,
    })
    .select("user_id, daily_post_count, daily_image_count, last_reset_date")
    .single();

  if (insertError) throw insertError;
  return created;
}

async function ensureTodayProfile(supabase: any, userId: string) {
  const profile = await getOrCreateProfile(supabase, userId);
  const today = new Date().toISOString().slice(0, 10);

  if (profile.last_reset_date === today) {
    return profile;
  }

  const { data: resetProfile, error: resetError } = await supabase
    .from("profiles")
    .update({
      daily_post_count: 0,
      daily_image_count: 0,
      last_reset_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id, daily_post_count, daily_image_count, last_reset_date")
    .single();

  if (resetError) throw resetError;
  return resetProfile;
}

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

const OutputSchema = z.object({
  posts: z.array(PostSchema).min(1),
});

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

function estimateWeeksBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  return Math.max(1, Math.ceil(days / 7));
}

function buildScheduleDates(start: Date, end: Date, postsPerWeek: number) {
  const weeks = estimateWeeksBetween(start, end);
  const perWeek = Math.max(1, Math.min(7, Math.floor(postsPerWeek || 1)));
  const dates: string[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + w * 7);

    for (let k = 0; k < perWeek; k++) {
      const offset = Math.floor(((k + 1) * 7) / (perWeek + 1));
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + offset);

      if (d < start) continue;
      if (d > end) continue;

      const iso = toISODate(d);
      if (!dates.includes(iso)) dates.push(iso);
    }
  }

  dates.sort();
  return dates;
}

function clampStr(s: string, max = 2200) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function normalizeDateString(input: string) {
  const s = String(input || "").trim();

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  const dt = new Date(s);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }

  return s;
}

function marketToCountryCode(market: string) {
  const m = (market || "").toUpperCase();
  const map: Record<string, string> = {
    US: "US",
    UK: "GB",
    FR: "FR",
    DE: "DE",
    ES: "ES",
    JP: "JP",
  };
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

type Holiday = {
  date: string;
  localName?: string;
  name?: string;
};

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
      if (h?.date) {
        all.push({
          date: String(h.date),
          localName: h.localName,
          name: h.name,
        });
      }
    }
  }

  const data = all
    .filter((h) => h.date >= startISO && h.date <= endISO)
    .sort((a, b) => a.date.localeCompare(b.date));

  holidayCache.set(cacheKey, { ts: Date.now(), data });
  return data;
}

function pickHashtags(industry: string) {
  const base = ["wellness", "selfcare", "dailyhabits", "shoponline"];
  const map: Record<string, string[]> = {
    保健品: ["supplements", "coq10", "hearthealth", "energyboost"],
    护肤: ["skincare", "glowingskin", "beautyroutine", "cleanbeauty"],
    美容: ["beauty", "beautytips", "musthave", "routine"],
    时尚: ["style", "outfit", "streetstyle", "wardrobe"],
    电子产品: ["tech", "gadgets", "smartlife", "innovation"],
    家居: ["homedecor", "cozyhome", "interior", "homeideas"],
    宠物: ["petlove", "petcare", "catlife", "doglife"],
    运动健身: ["fitness", "workout", "training", "fitlife"],
  };
  return [...base, ...(map[industry] || [])].slice(0, 10);
}

function buildImagePrompt(state: FormState, platform: Platform) {
  if (!state.useImage) return undefined;

  const ratio =
    platform === "instagram"
      ? "1:1"
      : platform === "pinterest"
      ? "2:3"
      : platform === "facebook"
      ? "4:5"
      : "16:9";

  return `Create a marketing image for "${state.productName}".
Style: ${state.imageStyle}. Tone: ${state.tone}. Audience: ${state.audience}. Industry: ${state.industry}.
Composition: premium DTC ad, clean layout, strong focal product, readable negative space, no excessive text.
Aspect ratio: ${ratio}.`;
}

function styleSuffix(imageStyle: string) {
  const map: Record<string, string> = {
    "自然真实(生活方式)":
      "Lifestyle, candid real-life scene, natural daylight, human touch, authentic, not overly staged.",
    高端质感:
      "Premium, refined materials, editorial lighting, subtle shadows, luxury product photography.",
    "(暗调奢华)":
      "Low-key luxury, dark moody background, rim light, glossy highlights, cinematic contrast.",
    "明亮电商(干净棚拍)":
      "High-key studio lighting, clean backdrop, crisp details, e-commerce style, minimal clutter.",
    "科技感(冷色未来)":
      "Cool tones, futuristic, neon accents, metallic textures, clean tech aesthetic.",
    "清新自然(植物光感)":
      "Fresh, airy, botanical elements, soft green highlights, gentle sunlight, clean wellness vibe.",
    "运动能量(动感硬朗)":
      "Dynamic composition, bold angles, energetic mood, sporty textures, punchy contrast.",
    "可爱卡通(软萌插画)":
      "Cute, soft illustration style, rounded shapes, playful, friendly color mood.",
    "极简留白(高级排版)":
      "Minimal layout, lots of negative space, modern design grid, premium composition.",
  };
  return map[imageStyle] || "Premium DTC aesthetic, clean composition, modern lighting.";
}

function isMajorMarketingHoliday(name?: string) {
  const s = String(name || "").toLowerCase();

  return [
    "black friday",
    "cyber monday",
    "christmas",
    "christmas day",
    "new year",
    "new year's day",
    "valentine",
    "valentine's day",
    "mother's day",
    "father's day",
    "easter",
    "halloween",
    "thanksgiving",
    "boxing day",
    "prime day",
    "singles' day",
    "singles day",
    "11.11",
    "double 11",
    "double eleven",
    "labor day",
    "labour day",
    "independence day",
    "back to school",
    "ramadan",
    "eid",
    "eid al-fitr",
    "eid al-adha",
  ].some((k) => s.includes(k));
}

/** ===== DeepSeek ===== */
function buildSystemPrompt() {
  return `
You are a senior social media copywriter for cross-border DTC brands (Shopify sellers).
Return ONLY valid JSON. No markdown. No extra text.
Schema: { "posts": [ { "platform": "...", "scheduledDate": "YYYY-MM-DD", "title"?, "bodyText": "...", "hashtags": ["..."], "imagePrompt"? } ] }

Rules:
- You must return exactly one post for every requested date.
- You are generating for one platform at a time.
- Every post must use the requested platform only.
- Every post must be in the requested language only.
- Never output Chinese unless the requested language is Chinese.
- Platform styles:
  - instagram: longer caption ok, line breaks, friendly CTA, emojis allowed.
  - facebook: informative, trust-building, clear CTA.
  - x: concise, punchy, ideally <= 240 chars.
  - pinterest: benefit-led, save-worthy, include helpful title sometimes.
- If needHashtags=false => [].
- If useImage=false => omit imagePrompt.
- If useImage=true => provide imagePrompt per post (short but specific).
- The imagePrompt should describe a marketing image concept, but should not assume the product shape can change.
- If the product is packaged in a pouch / sachet / bag, do not rewrite it as a bottle.
Holiday usage: natural, not forced.
- For major seasonal or commercial holidays, prefer timely promotional angles that match the platform style.
- Black Friday and Cyber Monday are especially important high-priority commerce events.
- Holiday copy should sound native, relevant, and useful for ecommerce marketing, not like a generic holiday greeting.
Safety: avoid medical claims/guarantees for supplements/skincare. Use compliant language like "supports", "may", "daily routine".
`;
}

function buildUserPrompt(
  state: FormState,
  platform: Platform,
  startISO: string,
  endISO: string,
  holidays: Holiday[],
  dates: string[]
) {
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  const majorHolidays = sortedHolidays.filter((h) =>
    isMajorMarketingHoliday(h.name || h.localName)
  );

  const holidayText =
    sortedHolidays.length === 0
      ? "No holiday data available."
      : sortedHolidays
          .slice(0, 25)
          .map((h) => {
            const holidayName = h.name || h.localName || "Holiday";
            const tag = isMajorMarketingHoliday(holidayName) ? " [MAJOR]" : "";
            return `- ${h.date}: ${holidayName}${tag}`;
          })
          .join("\n");

  const majorHolidayText =
    majorHolidays.length === 0
      ? "No major marketing holidays in this range."
      : majorHolidays
          .slice(0, 10)
          .map((h) => `- ${h.date}: ${h.name || h.localName || "Holiday"}`)
          .join("\n");

  return `
Generate a social posting plan for ONLY ONE platform.

Inputs:
- platform: ${platform}
- market: ${state.market} (countryCode=${marketToCountryCode(state.market)})
- language: ${state.language}
- tone: ${state.tone}
- audience: ${state.audience}
- industry: ${state.industry}
- brandName: ${state.brandName || ""}
- productName: ${state.productName}
- keySellingPoints: ${clampStr(state.keySellingPoints, 1200)}
- needHashtags: ${state.needHashtags}
- useImage: ${state.useImage}
- imageStyle: ${state.useImage ? state.imageStyle : "N/A"}
- date range: ${startISO} to ${endISO}

Public holidays within date range:
${holidayText}

Major marketing holidays within date range:
${majorHolidayText}

Requirements:
- Generate exactly ${dates.length} posts.
- Platform must be ONLY "${platform}" for every post.
- Use these dates exactly, one post per date: ${dates.join(", ")}
- scheduledDate must be exactly in YYYY-MM-DD format.
- Do not use natural language dates.
- Do not use slash dates.
- Every post must be unique in angle, copy, and imagePrompt.
- Output in ${state.language} only.
- Do not output Chinese unless the selected language is Chinese.
- Return ONLY JSON.
- Use holidays as natural marketing hooks when relevant to the scheduled date.
- If there is a major marketing holiday close to a scheduled date, strongly prefer making that post holiday-relevant.
- Prioritize major commercial holidays such as Black Friday, Cyber Monday, Christmas, Valentine's Day, Mother's Day, Father's Day, Halloween, Thanksgiving, Singles' Day, and New Year.
- Around major holidays, at least some posts should clearly reflect seasonal shopping intent, gifting intent, promotional timing, or festive relevance.
- Holiday angles must feel natural and conversion-oriented, not forced or generic.
- If no relevant holiday is near a scheduled date, use evergreen marketing angles instead.
`;
}

async function callDeepSeek(system: string, user: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY");

  const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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
  if (!content || typeof content !== "string") {
    throw new Error("DeepSeek: empty content");
  }

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

/** ===== removebg ===== */
async function removeBgRaw(input: Buffer, inputMime: string) {
  const url = process.env.REMOVE_BG_URL;
  if (!url) throw new Error("REMOVE_BG_URL not set");

  const body = new Uint8Array(input);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": inputMime || "application/octet-stream" },
    body,
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`removebg_raw failed: ${resp.status} ${t.slice(0, 200)}`);
  }

  const arr = new Uint8Array(await resp.arrayBuffer());
  return Buffer.from(arr);
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

/** ===== mock fallback ===== */
function buildMockPlan(state: FormState, start: Date, end: Date, warning?: string) {
  const startISO = toISODate(start);
  const endISO = toISODate(end);
  const dates = buildScheduleDates(start, end, state.postsPerWeek);
  const platforms = state.platforms as Platform[];

  const posts: GeneratedPost[] = [];
  let idx = 0;

  for (let di = 0; di < dates.length; di++) {
    const day = dates[di];

    for (const p of platforms) {
      posts.push({
        id: `mock-${p}-${day}-${idx++}`,
        platform: p,
        scheduledDate: day,
        title: undefined,
        bodyText: `${state.productName}`,
        hashtags: p === "instagram" ? pickHashtags(state.industry) : [],
        imagePrompt: state.useImage ? buildImagePrompt(state, p as Platform) : undefined,
        imageUrl: undefined,
        sharedImageKey: state.useImage ? day : undefined,
        referenceImageUrl: undefined,
        brandName: state.brandName || state.productName || "Brand",
        brand: {
          name: state.brandName || state.productName || "Brand",
          avatarUrl: state.avatarUrl || undefined,
          handle:
            p === "instagram" || p === "x"
              ? `@${String(state.brandName || state.productName || "brand").replace(/^@/, "")}`
              : String(state.brandName || state.productName || "Brand"),
        },
      } as GeneratedPost);
    }
  }

  const res: any = {
    taskId: `mock_${Date.now()}`,
    startDate: startISO,
    endDate: endISO,
    posts,
  };

  if (warning) res.warning = warning;
  return res as GenerateResponse & { warning?: string };
}

/** ===== main ===== */
export async function POST(req: Request) {
  const start = new Date();

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

  if ((state.months || 0) > FREE_MAX_MONTHS) {
    return NextResponse.json(
      { error: `免费版单次最多支持 ${FREE_MAX_MONTHS} 个月` },
      { status: 400 }
    );
  }

  if ((state.postsPerWeek || 0) > FREE_MAX_POSTS_PER_WEEK) {
    return NextResponse.json(
      { error: `免费版每周最多支持 ${FREE_MAX_POSTS_PER_WEEK} 天发帖` },
      { status: 400 }
    );
  }

  if ((state.platforms?.length || 0) > FREE_MAX_PLATFORMS) {
    return NextResponse.json(
      { error: `免费版单次最多支持 ${FREE_MAX_PLATFORMS} 个平台` },
      { status: 400 }
    );
  }

  const endReal = addMonths(start, state.months);
  const startISO = toISODate(start);
  const endISO = toISODate(endReal);

  const countryCode = marketToCountryCode(state.market);
  const holidays = await getHolidaysNager(countryCode, startISO, endISO);

  const savedUploads = await saveUploadedFiles(uploadedFiles.slice(0, MAX_UPLOAD_IMAGES));

  let warning: string | undefined;
  let referenceUrls: string[] = [];

  if (state.useImage && savedUploads.length) {
    try {
      if (process.env.REMOVE_BG_URL) {
        const cutouts = await removeBgAndSave(savedUploads);
        referenceUrls = cutouts.map((c) => c.url);
      } else {
        throw new Error("REMOVE_BG_URL not set");
      }
    } catch (e: any) {
      warning = `removebg 失败，已使用原图继续。原因：${String(e?.message || e).slice(0, 180)}`;
      referenceUrls = savedUploads.map((up) => up.url);
    }
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(
      buildMockPlan(state, start, endReal, "未配置 DeepSeek Key，已使用 Mock 生成。")
    );
  }

  let currentUserId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      currentUserId = user.id;

      const profile = await ensureTodayProfile(supabase, user.id);

      if (profile.daily_post_count >= DAILY_POST_LIMIT) {
        return NextResponse.json(
          { error: `今日生成次数已达上限（${DAILY_POST_LIMIT}次）` },
          { status: 429 }
        );
      }
    }
  } catch (quotaErr) {
    console.error("[quota] post quota check failed:", quotaErr);
  }

  try {
    const dates = buildScheduleDates(start, endReal, state.postsPerWeek);
    const platforms = state.platforms as Platform[];
    const system = buildSystemPrompt();
    const mergedPosts: z.infer<typeof PostSchema>[] = [];

    for (const plat of platforms) {
      const userPrompt = buildUserPrompt(state, plat, startISO, endISO, holidays, dates);
      const raw = await callDeepSeek(system, userPrompt);

      console.log(`[DeepSeek raw ${plat}]`, raw);

      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error(`Model returned non-JSON content for ${plat}: ${raw.slice(0, 200)}`);
      }

      if (Array.isArray(parsed?.posts)) {
        parsed.posts = parsed.posts.map((post: any, i: number) => {
          const normalized = normalizeDateString(post?.scheduledDate);
          const fallbackDate = dates?.[i] || new Date().toISOString().slice(0, 10);

          return {
            ...post,
            scheduledDate: /^\d{4}-\d{2}-\d{2}$/.test(normalized)
              ? normalized
              : fallbackDate,
          };
        });
      }

      const out = OutputSchema.parse(parsed);

      console.log(`[DeepSeek posts total ${plat}]`, out.posts.length);
      console.log(
        `[DeepSeek posts by platform ${plat}]`,
        out.posts.map((p) => `${p.platform}:${p.scheduledDate}`).join(" | ")
      );

      const onlyThisPlatform = out.posts.filter((p) => p.platform === plat);

      if (onlyThisPlatform.length < dates.length) {
        throw new Error(
          `DeepSeek returned insufficient posts for ${plat}: got ${onlyThisPlatform.length}, expected ${dates.length}`
        );
      }

      mergedPosts.push(...onlyThisPlatform.slice(0, dates.length));
    }

    const byPlatform = new Map<Platform, Array<z.infer<typeof PostSchema>>>();
    for (const plat of platforms) byPlatform.set(plat, []);

    for (const post of mergedPosts) {
      const k = post.platform as Platform;
      if (!byPlatform.has(k)) byPlatform.set(k, []);
      byPlatform.get(k)!.push(post as any);
    }

    const suffix = styleSuffix(state.imageStyle);

    const dayReferenceUrl: Record<string, string | undefined> = {};
    if (state.useImage) {
      for (let di = 0; di < dates.length; di++) {
        const day = dates[di];
        dayReferenceUrl[day] =
          referenceUrls.length > 0 ? referenceUrls[di % referenceUrls.length] : undefined;
      }
    }

    const posts: GeneratedPost[] = [];
    let idx = 0;

    for (let di = 0; di < dates.length; di++) {
      const day = dates[di];

      for (const plat of platforms) {
        const pool = byPlatform.get(plat) ?? [];
        const pick = pool[di] ?? null;

        const basePrompt = state.useImage
          ? pick?.imagePrompt || buildImagePrompt(state, plat) || ""
          : undefined;

        const finalPrompt =
          state.useImage && basePrompt
            ? `${basePrompt}

Style hints: ${suffix}

Rules:
- keep product clear
- avoid heavy text overlay
- the product must stay exactly the same as the reference image
- do not change packaging shape
- do not change product type
- do not turn pouch packaging into a bottle
- do not alter label structure or overall silhouette`
            : undefined;

        posts.push({
          id: `${plat}-${day}-${idx++}`,
          platform: plat,
          scheduledDate: day,
          title: pick?.title,
          bodyText: pick?.bodyText || `${state.productName}`,
          hashtags:
            plat === "instagram"
              ? pick?.hashtags || pickHashtags(state.industry)
              : [],
          imagePrompt: state.useImage ? finalPrompt : undefined,
          imageUrl: undefined,
          sharedImageKey: state.useImage ? day : undefined,
          referenceImageUrl: state.useImage ? dayReferenceUrl[day] : undefined,
          brandName: state.brandName || state.productName || "Brand",
          brand: {
            name: state.brandName || state.productName || "Brand",
            avatarUrl: state.avatarUrl || undefined,
            handle:
              plat === "instagram" || plat === "x"
                ? `@${String(state.brandName || state.productName || "brand").replace(/^@/, "")}`
                : String(state.brandName || state.productName || "Brand"),
          },
        } as GeneratedPost);
      }
    }

    const res: GenerateResponse = {
      taskId: `ds_${Date.now()}`,
      startDate: startISO,
      endDate: endISO,
      posts,
    };

    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: campaignRow, error: campaignError } = await supabase
          .from("campaigns")
          .insert({
            user_id: user.id,
            product_name: state.productName || null,
            brand_name: state.brandName || null,
            market: state.market || null,
            language: state.language || null,
            platforms: state.platforms || [],
            posts_per_week: state.postsPerWeek || null,
            months: state.months || null,
            use_image: !!state.useImage,
            image_style: state.imageStyle || null,
            tone: state.tone || null,
            audience: state.audience || null,
            industry: state.industry || null,
            key_selling_points: state.keySellingPoints || null,
          })
          .select("id")
          .single();

        if (campaignError) {
          console.error("[history] campaign insert failed:", campaignError);
        } else if (campaignRow?.id) {
          const postRows = posts.map((post) => ({
            campaign_id: campaignRow.id,
            user_id: user.id,
            platform: post.platform,
            scheduled_date: post.scheduledDate,
            title: post.title || null,
            body_text: post.bodyText,
            hashtags: post.hashtags || [],
            image_prompt: post.imagePrompt || null,
            image_url: post.imageUrl || null,
            shared_image_key: (post as any).sharedImageKey || null,
            reference_image_url: (post as any).referenceImageUrl || null,
          }));

          const { error: postsError } = await supabase
            .from("generated_posts")
            .insert(postRows);

          if (postsError) {
            console.error("[history] generated_posts insert failed:", postsError);
          } else if (currentUserId) {
            const profile = await ensureTodayProfile(supabase, currentUserId);

            const { error: quotaUpdateError } = await supabase
              .from("profiles")
              .update({
                daily_post_count: profile.daily_post_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", currentUserId);

            if (quotaUpdateError) {
              console.error("[quota] daily_post_count update failed:", quotaUpdateError);
            }
          }
        }
      }
    } catch (historyErr) {
      console.error("[history] unexpected save error:", historyErr);
    }

    return NextResponse.json(warning ? ({ ...res, warning } as any) : res);
  } catch (e: any) {
    const msg = String(e?.message || "DeepSeek failed");
    const w =
      msg.includes("402") || msg.toLowerCase().includes("insufficient balance")
        ? "DeepSeek balance issue (402), fallback used."
        : `DeepSeek failed, fallback used. Reason: ${msg.slice(0, 180)}`;

    return NextResponse.json(
      buildMockPlan(state, start, endReal, warning ? `${w}; ${warning}` : w)
    );
  }
}
