"use client";

import { useState } from "react";
import type { GenerateResponse, GeneratedPost } from "@/lib/spg-types";
import { FormPanel } from "@/components/spg/FormPanel";
import { PreviewPanel } from "@/components/spg/PreviewPanel";
import { Card } from "@/components/ui/card";

export default function AppPage() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);

  function onGenerated(res: GenerateResponse) {
    setPosts(res.posts);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <div className="text-xl font-semibold">Zoone Social Post Generator</div>
          <div className="text-sm text-muted-foreground">中文界面 · 海外风格 · 按平台仿真展示 · 按月份横向滑动</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <FormPanel onGenerated={onGenerated} />
          </div>

          <div className="lg:col-span-7">
            <Card className="p-4 min-h-[720px]">
              <PreviewPanel posts={posts} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
