/* eslint-disable no-console */

export type ArkImageSize = "1K" | "2K" | "adaptive";

export async function arkGenerateImage(params: {
  prompt: string;
  image?: string | string[]; // data-url or array of data-url
  size?: ArkImageSize;
  watermark?: boolean;
  sequential?: "disabled" | "auto";
  maxImages?: number;
  stream?: boolean;
}) {
  const baseUrl = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_IMAGE_MODEL || "doubao-seedream-4-5-251128";
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
  console.log("[ark] prompt =", params.prompt.slice(0,120));
  console.log("[ark] image passed =", !!params.image);
  console.log("[ark] model =", model);
  console.log("[ark] hasImage =", Boolean(body.image));
  console.log("[ark] imageType =", Array.isArray(body.image) ? "array" : typeof body.image);
  console.log("[ark] imagePreviewLen =", Array.isArray(body.image)
    ? (body.image[0]?.length || 0)
    : (body.image?.length || 0));

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
