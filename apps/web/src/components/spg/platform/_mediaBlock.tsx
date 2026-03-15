"use client";

import { useEffect, useMemo, useState } from "react";
import { PlatformLogo } from "./_platformLogo";

type Props = {
  platform: string;
  imageUrl?: string;
  imagePrompt?: string;
  sharedImageKey?: string;
  referenceImageUrl?: string;
  heightClass?: string;
  autoGenerate?: boolean;
  onImageGenerated?: (imageUrl: string) => void;
};

export function MediaBlock(props: Props) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.imageUrl || undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (props.imageUrl) {
      setImageUrl(props.imageUrl);
    }
  }, [props.imageUrl]);

  async function generate() {
    if (!props.imagePrompt) {
      setError("没有图片提示词");
      return;
    }

    if (!props.referenceImageUrl) {
      setError("没有参考产品图");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: props.imagePrompt,
          sharedKey: props.sharedImageKey || "",
          referenceImageUrl: props.referenceImageUrl
        })
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error || "生成失败");
      }

      const url = String(j?.imageUrl || "").trim();
      if (!url) {
        throw new Error("没有返回图片地址");
      }

	const finalUrl = url.startsWith("data:")
  ? url
  : url.includes("?")
    ? `${url}&t=${Date.now()}`
    : `${url}?t=${Date.now()}`;

      console.log("[MediaBlock] generated image url =", finalUrl);

      setImageUrl(finalUrl);
props.onImageGenerated?.(finalUrl);
      setError("");
    } catch (e: any) {
      console.error("[MediaBlock] generate failed:", e);
      setImageUrl(undefined);
      setError(String(e?.message || "生成失败"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <PlatformLogo
              platform={props.platform as any}
              className="h-4 w-4 text-muted-foreground"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {loading ? "正在生成图片..." : imageUrl ? "图片已生成" : "暂无图片"}
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
          disabled={loading}
          onClick={generate}
        >
          {loading ? "生成中..." : "生成图片"}
        </button>
      </div>

      <div
        className={`mt-3 w-full overflow-hidden rounded-xl border bg-muted ${
          props.heightClass || "h-[240px]"
        }`}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            正在生成图片...
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const failedUrl = (e.currentTarget as HTMLImageElement).src;
              console.error("[MediaBlock] image load failed:", failedUrl);
              setImageUrl(undefined);
              setError(`图片加载失败：${failedUrl}`);
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <div>暂无图片</div>
            <div>点击上方按钮生成图片</div>
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-2 text-xs text-red-500 break-all">{error}</div>
      ) : null}
    </div>
  );
}
