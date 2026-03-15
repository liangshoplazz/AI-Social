"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  product_name: string | null;
  created_at: string;
};

type Post = {
  id: string;
  platform: string;
  body_text: string;
  image_url: string | null;
  scheduled_date: string;
};

export default function HistoryPanel() {
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, product_name, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setCampaigns(data);
    }
  }

  async function openCampaign(id: string) {
    setSelectedCampaign(id);

    const { data, error } = await supabase
      .from("generated_posts")
      .select("id, platform, body_text, image_url, scheduled_date")
      .eq("campaign_id", id)
      .order("scheduled_date", { ascending: true });

    if (!error && data) {
      setPosts(data);
    }
  }

  return (
    <div className="space-y-6">
      {!selectedCampaign && (
        <div className="space-y-3">
          <div className="text-lg font-semibold">历史生成记录</div>

          {campaigns.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无历史记录</div>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id}
                onClick={() => openCampaign(c.id)}
                className="cursor-pointer rounded-xl border p-4 hover:bg-muted"
              >
                <div className="font-medium">{c.product_name || "Campaign"}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedCampaign && (
        <div className="space-y-4">
          <button
            onClick={() => {
              setSelectedCampaign(null);
              setPosts([]);
            }}
            className="text-sm text-blue-600"
          >
            ← 返回历史记录
          </button>

          {posts.map((p) => (
            <div key={p.id} className="space-y-3 rounded-xl border p-4">
              <div className="text-sm text-muted-foreground">
                {p.platform} · {p.scheduled_date}
              </div>

              <div className="whitespace-pre-line text-sm">
                {p.body_text}
              </div>

              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  className="max-h-80 rounded-lg border"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
