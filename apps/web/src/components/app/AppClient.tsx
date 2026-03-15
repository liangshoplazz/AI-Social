"use client";

import { useState } from "react";
import type { GenerateResponse, GeneratedPost } from "@/lib/spg-types";
import { FormPanel } from "@/components/spg/FormPanel";
import PreviewPanel from "@/components/spg/PreviewPanel";
import { Card } from "@/components/ui/card";
import HistoryPanel from "@/components/spg/HistoryPanel";

export default function AppClient() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [data, setData] = useState<GenerateResponse | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tab, setTab] = useState<"generate" | "history">("generate");

  function onGenerated(res: GenerateResponse) {
    setData(res);
    setPosts(res.posts);
  }
function handlePostImageUpdate(postId: string, imageUrl: string) {
  setPosts((prev) =>
    prev.map((post) =>
      post.id === postId ? { ...post, imageUrl } : post
    )
  );

  setData((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId ? { ...post, imageUrl } : post
      ),
    };
  });
}

  async function handleLogout() {
    try {
      setLoggingOut(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xl font-semibold">Shoplazza AI Social</div>
            <div className="text-sm text-muted-foreground">
              中文界面 · 海外风格 · 按平台仿真展示 · 按月份/平台分组
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
            >
              返回首页
            </a>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              {loggingOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <FormPanel onGenerated={onGenerated} />
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-6">
	    <Card className="h-[calc(100vh-120px)] overflow-auto p-4">
  <div className="mb-4 flex gap-4 border-b pb-2">
    <button
      onClick={() => setTab("generate")}
      className={tab === "generate" ? "font-semibold" : "text-muted-foreground"}
    >
      本次生成
    </button>

    <button
      onClick={() => setTab("history")}
      className={tab === "history" ? "font-semibold" : "text-muted-foreground"}
    >
      历史记录
    </button>
  </div>

  {tab === "generate" && (
<PreviewPanel
  data={data}
  posts={posts}
  onPostImageUpdate={handlePostImageUpdate}
/>
  )}

  {tab === "history" && (
    <HistoryPanel />
  )}
</Card>
          </div>
        </div>
      </div>
    </div>
  );
}
