import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

function contentTypeFromExt(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = String(searchParams.get("name") || "").trim();

    if (!name) {
      return NextResponse.json({ error: "missing name" }, { status: 400 });
    }

    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "invalid name" }, { status: 400 });
    }

    const fp = path.join(process.cwd(), "public", "generated", name);
    const buf = await fs.readFile(fp);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeFromExt(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e || "read generated file failed") },
      { status: 404 }
    );
  }
}
