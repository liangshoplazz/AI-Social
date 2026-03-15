import { NextResponse } from "next/server";
import { arkGenerateImage } from "@/lib/ark";
import path from "path";
import { promises as fs } from "fs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

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

const inflight = new Map<string, Promise<string>>();

function mimeFromExt(fp: string) {
  const ext = path.extname(fp).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function localPublicUrlToDataUrl(referenceImageUrl: string) {
  const clean = referenceImageUrl.split("?")[0].split("#")[0];
  const rel = clean.replace(/^\/+/, "");
  const fp = path.join(process.cwd(), "public", rel);

  const buf = await fs.readFile(fp);
  const mime = mimeFromExt(fp);

  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function remoteUrlToDataUrl(referenceImageUrl: string, req: Request) {
  const abs = /^https?:\/\//i.test(referenceImageUrl)
    ? referenceImageUrl
    : new URL(referenceImageUrl, req.url).toString();

  const res = await fetch(abs);

  if (!res.ok) {
    throw new Error(`reference image fetch failed: ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "image/png";
  const buf = Buffer.from(await res.arrayBuffer());

  return `data:${ct};base64,${buf.toString("base64")}`;
}

async function fetchAsDataUrl(referenceImageUrl: string, req: Request) {
  if (
    referenceImageUrl.startsWith("/cutouts/") ||
    referenceImageUrl.startsWith("/uploads/")
  ) {
    return localPublicUrlToDataUrl(referenceImageUrl);
  }

  return remoteUrlToDataUrl(referenceImageUrl, req);
}

async function downloadRemoteImageAsDataUrl(remoteUrl: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[generate-image] downloading remote image attempt ${attempt}:`, remoteUrl);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(remoteUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://ark.cn-beijing.volces.com/",
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`download generated image failed: ${res.status} ${text.slice(0, 200)}`);
      }

      const ct = res.headers.get("content-type") || "image/jpeg";
      const buf = Buffer.from(await res.arrayBuffer());

      console.log("[generate-image] remote image downloaded ok");
      return `data:${ct};base64,${buf.toString("base64")}`;
    } catch (e) {
      lastError = e;
      console.error(`[generate-image] remote image download failed attempt ${attempt}:`, e);
      if (attempt < 3) {
        await sleep(1200 * attempt);
      }
    }
  }

  throw new Error(`ark image download failed after retries: ${String((lastError as any)?.message || lastError)}`);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const prompt = String(body?.prompt || "").trim();
    const sharedKey = String(body?.sharedKey || "").trim();
    const referenceImageUrl = String(body?.referenceImageUrl || "").trim();

    console.log("[generate-image] prompt =", prompt.slice(0, 120));
    console.log("[generate-image] sharedKey =", sharedKey);
    console.log("[generate-image] referenceImageUrl =", referenceImageUrl);

    if (!prompt) {
      return NextResponse.json({ error: "missing prompt" }, { status: 400 });
    }

    if (!referenceImageUrl) {
      return NextResponse.json({ error: "missing referenceImageUrl" }, { status: 400 });
    }

    const doWork = async () => {
      let image: string;

      try {
        image = await fetchAsDataUrl(referenceImageUrl, req);
        console.log("[generate-image] reference image loaded ok");
      } catch (e: any) {
        throw new Error(`reference image load failed: ${String(e?.message || e)}`);
      }

      const finalPrompt =
        prompt +
        " The product must stay exactly the same as the reference image. Do not change packaging shape, product type, material, label position, or overall silhouette. If the product is a pouch or bag, keep it as a pouch or bag and do not turn it into a bottle.";

      let remoteUrl: string;
      try {
        remoteUrl = await arkGenerateImage({
          prompt: finalPrompt,
          image: [image],
          size: "2K",
        });
        console.log("[generate-image] ark remote url =", remoteUrl);
      } catch (e: any) {
        throw new Error(`ark generate failed: ${String(e?.message || e)}`);
      }

      try {
        return await downloadRemoteImageAsDataUrl(remoteUrl);
      } catch (e: any) {
        throw new Error(`ark image download failed: ${String(e?.message || e)}`);
      }
    };

    let imageUrl: string;

    if (sharedKey) {
      if (!inflight.has(sharedKey)) {
        inflight.set(
          sharedKey,
          doWork().finally(() => {
            inflight.delete(sharedKey);
          })
        );
      }

      imageUrl = await inflight.get(sharedKey)!;
    } else {
      imageUrl = await doWork();
    }

      try {
      if (sharedKey) {
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase
            .from("generated_posts")
            .update({ image_url: imageUrl })
            .eq("user_id", user.id)
            .eq("shared_image_key", sharedKey);

          if (error) {
            console.error("[generate-image] update image_url failed:", error);
          } else {
            console.log("[generate-image] image_url updated for sharedKey =", sharedKey);
          }
        }
      }
    } catch (dbErr) {
      console.error("[generate-image] save image_url failed:", dbErr);
    }

    return NextResponse.json({ imageUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || "generate-image failed") },
      { status: 500 }
    );
  }
}
