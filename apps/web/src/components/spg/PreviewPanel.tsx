"use client";

import type { GeneratedPost, Platform } from "@/lib/spg-types";
import { InstagramCard } from "./platform/InstagramCard";
import { FacebookCard } from "./platform/FacebookCard";
import { XCard } from "./platform/XCard";
import { PinterestCard } from "./platform/PinterestCard";
import { Separator } from "@/components/ui/separator";

function renderCard(post: GeneratedPost) {
  switch (post.platform) {
    case "instagram":
      return <InstagramCard post={post} />;
    case "facebook":
      return <FacebookCard post={post} />;
    case "x":
      return <XCard post={post} />;
    case "pinterest":
      return <PinterestCard post={post} />;
  }
}

function monthKey(dateStr: string) {
  // YYYY-MM-DD -> YYYY-MM
  return dateStr.slice(0, 7);
}

export function PreviewPanel({ posts }: { posts: GeneratedPost[] }) {
  if (!posts.length) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        右侧将展示生成结果（按月份横向滑动）
      </div>
    );
  }

  const groups = posts.reduce<Record<string, GeneratedPost[]>>((acc, p) => {
    const k = monthKey(p.scheduledDate);
    acc[k] = acc[k] || [];
    acc[k].push(p);
    return acc;
  }, {});

  const months = Object.keys(groups).sort();

  return (
    <div className="space-y-6">
      {months.map((m) => (
        <div key={m} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{m}</div>
            <div className="text-xs text-muted-foreground">{groups[m].length} posts</div>
          </div>
          <Separator />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {groups[m].map((p) => (
              <div key={p.id} className="shrink-0">
                {renderCard(p)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
