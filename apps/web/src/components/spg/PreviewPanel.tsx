"use client";

import React, { useMemo, useState, useEffect } from "react";
import type { GenerateResponse, GeneratedPost, Platform } from "@/lib/spg-types";

import { InstagramCard } from "@/components/spg/platform/InstagramCard";
import { FacebookCard } from "@/components/spg/platform/FacebookCard";
import { XCard } from "@/components/spg/platform/XCard";
import { PinterestCard } from "@/components/spg/platform/PinterestCard";

type Props = {
  data: GenerateResponse | null;
  posts: GeneratedPost[];
  onPostImageUpdate?: (postId: string, imageUrl: string) => void;
};

const PLATFORM_ORDER: Platform[] = ["instagram", "facebook", "x", "pinterest"];

function parseISODateUTC(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z");
}

function monthKeyUTC(dateStr: string) {
  const d = parseISODateUTC(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabelCN(monthKey: string) {
  const [y, m] = monthKey.split("-");
  return `${y}年${Number(m)}月`;
}

function PlatformCard({
  post,
  autoGenerate = false,
  onPostImageUpdate,
}: {
  post: GeneratedPost;
  autoGenerate?: boolean;
  onPostImageUpdate?: (postId: string, imageUrl: string) => void;
}) {
  switch (post.platform) {
case "instagram":
  return (
    <InstagramCard
      post={post}
      autoGenerate={autoGenerate}
      onPostImageUpdate={onPostImageUpdate}
    />
  );

case "facebook":
  return (
    <FacebookCard
      post={post}
      autoGenerate={autoGenerate}
      onPostImageUpdate={onPostImageUpdate}
    />
  );
case "x":
  return (
    <XCard
      post={post}
      autoGenerate={autoGenerate}
      onPostImageUpdate={onPostImageUpdate}
    />
  );
case "pinterest":
  return (
    <PinterestCard
      post={post}
      autoGenerate={autoGenerate}
      onPostImageUpdate={onPostImageUpdate}
    />
  );
   default:
      return (
        <div className="rounded-xl border bg-background p-4 text-sm">
          <div className="font-medium">Unknown platform: {String(post.platform)}</div>
          <div className="mt-2 whitespace-pre-wrap text-muted-foreground">{post.bodyText}</div>
        </div>
      );
  }
}

export default function PreviewPanel(props: Props) {
  const onPostImageUpdate = props.onPostImageUpdate;
  const data = props.data ?? null;
  const allPosts = ((props.posts ?? data?.posts) ?? []).slice();
  const total = allPosts.length;

  // 关键：把已生成图片提升到父组件，切换月份后还能显示
  const [generatedImageMap, setGeneratedImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // 当重新生成整批帖子时，清空旧图
    setGeneratedImageMap({});
  }, [data?.taskId]);

  const groupedByMonth = useMemo(() => {
    allPosts.sort((a, b) => parseISODateUTC(a.scheduledDate).getTime() - parseISODateUTC(b.scheduledDate).getTime());
    const map = new Map<string, GeneratedPost[]>();

    for (const post of allPosts) {
      const key = monthKeyUTC(post.scheduledDate);
      const list = map.get(key) ?? [];
      list.push(post);
      map.set(key, list);
    }

    const months = Array.from(map.keys()).sort();
    return { months, map };
  }, [props.posts, data]);

  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  useEffect(() => {
    if (!activeMonth && groupedByMonth.months.length > 0) {
      setActiveMonth(groupedByMonth.months[0]);
    }
  }, [activeMonth, groupedByMonth.months]);

  const monthPosts = activeMonth ? groupedByMonth.map.get(activeMonth) ?? [] : allPosts;

  const byPlatform = useMemo(() => {
    const m = new Map<Platform, GeneratedPost[]>();
    for (const p of PLATFORM_ORDER) m.set(p, []);

    for (const post of monthPosts) {
      const p = post.platform as Platform;
      if (!m.has(p)) m.set(p, []);
      m.get(p)!.push(post);
    }

    for (const [k, v] of m.entries()) {
      v.sort((a, b) => parseISODateUTC(a.scheduledDate).getTime() - parseISODateUTC(b.scheduledDate).getTime());
      m.set(k, v);
    }

    return m;
  }, [monthPosts]);

  if (!data && total === 0) {
    return (
      <div className="h-full rounded-2xl border bg-background p-5">
        <div className="text-sm text-muted-foreground">右侧会预览生成的帖子（按平台样式展示）。</div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">预览</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {data ? (
              <>
                {data.startDate} → {data.endDate} · 共 {total} 条
              </>
            ) : (
              <>共 {total} 条</>
            )}
          </div>

          {data?.warning ? (
            <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
              {data.warning}
            </div>
          ) : null}
        </div>

        {groupedByMonth.months.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {groupedByMonth.months.map((m) => {
              const isActive = m === activeMonth;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMonth(m)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs transition",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  {monthLabelCN(m)}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-7">
        {PLATFORM_ORDER.map((plat) => {
          const list = byPlatform.get(plat) ?? [];
          if (!list.length) return null;

          return (
            <section key={plat} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {plat.toUpperCase()} <span className="text-muted-foreground">· {list.length} 条</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-2">
                  {list.map((post) => {
                    const sharedKey = post.sharedImageKey || post.id;
                    const hydratedPost = {
                      ...post,
                      imageUrl: generatedImageMap[sharedKey] || post.imageUrl,
                    };

                    return (
                      <div key={post.id} className="min-w-[340px] max-w-[360px] flex-none">

<PlatformCard
  post={hydratedPost}
  autoGenerate={false}
  onPostImageUpdate={(_postId, url) => {
    setGeneratedImageMap((prev) => ({
      ...prev,
      [sharedKey]: url,
    }));

    onPostImageUpdate?.(post.id, url);
  }}
/>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
