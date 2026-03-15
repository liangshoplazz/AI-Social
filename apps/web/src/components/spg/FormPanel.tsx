"use client";

import { useMemo, useRef, useState } from "react";
import type { FormState, GenerateResponse, Platform } from "@/lib/spg-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "pinterest", label: "Pinterest" },
];

export function FormPanel({ onGenerated }: { onGenerated: (res: GenerateResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState<string>("");
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [files, setFiles] = useState<File[]>([]);

  const [state, setState] = useState<FormState>({
    platforms: ["instagram"],
    market: "US",
    language: "English",
    tone: "友好有说服力",
    audience: "大众消费者",
    industry: "保健品",

    brandName: "",

    productName: "",
    keySellingPoints: "",

    // legacy
    needHashtags: true,

    mode: "text_only",
    useImage: false,
    imageStyle: "高端质感",
    postsPerWeek: 1,
    months: 1,
  });

  const canGenerate = useMemo(() => {
    if (!state.platforms.length) return false;
    if (!state.brandName?.trim()) return false;
    if (!state.productName.trim()) return false;
    if (!state.keySellingPoints.trim()) return false;
    return true;
  }, [state]);

  function togglePlatform(p: Platform) {
    setState((s) => {
      const exists = s.platforms.includes(p);
      const platforms = exists ? s.platforms.filter((x) => x !== p) : [...s.platforms, p];
      return { ...s, platforms };
    });
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);

    setProgress(5);
    setProgressText("正在提交任务…");

    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }

    const estimatedMs =
      (state.useImage ? 25000 : 12000) + (state.platforms?.length || 1) * 1500 + (state.postsPerWeek || 1) * 800;
    const startedAt = Date.now();

    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / Math.max(8000, estimatedMs));
      const next = Math.min(92, 5 + Math.floor(ratio * 87));
      setProgress((p) => (p < next ? next : p));

      if (next < 30) setProgressText("正在生成大纲…");
      else if (next < 70) setProgressText("正在生成各平台文案…");
      else setProgressText(state.useImage ? "正在生成图片…" : "正在整理结果…");
    }, 350);

    try {
      let res: Response;

      if (state.useImage && files.length) {
        const fd = new FormData();
        fd.append("payload", JSON.stringify(state));
        files.forEach((f) => fd.append("images", f));
        res = await fetch("/api/generate", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error || "生成失败（接口返回非 200）";
        if (typeof window !== "undefined") alert(msg);
        throw new Error(msg);
      }

      setProgress(100);
      setProgressText("生成完成");
      onGenerated(data as GenerateResponse);
    } finally {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText("");
      }, 800);
    }
  }
  const missingFields: string[] = [];
  if (!String(state.brandName ?? "").trim()) missingFields.push("品牌名");
  if (!String(state.productName ?? "").trim()) missingFields.push("产品名");
  if (!String(state.keySellingPoints ?? "").trim()) missingFields.push("核心卖点");

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="text-base font-semibold">社媒帖子生成器</div>
        <div className="text-xs text-muted-foreground">只需填品牌名 + 产品信息，即可生成并高仿预览</div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">1) 平台选择（可多选）</div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = state.platforms.includes(p.key);
            return (
              <Button
                key={p.key}
                type="button"
                variant={active ? "default" : "outline"}
                onClick={() => togglePlatform(p.key)}
                className="h-9"
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">2) 市场 & 输出语言</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm">市场（用于节日参考）</div>
            <Select value={state.market} onValueChange={(v) => setState((s) => ({ ...s, market: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">美国 US</SelectItem>
                <SelectItem value="UK">英国 UK</SelectItem>
                <SelectItem value="FR">法国 FR</SelectItem>
                <SelectItem value="DE">德国 DE</SelectItem>
                <SelectItem value="ES">西班牙 ES</SelectItem>
                <SelectItem value="JP">日本 JP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm">输出语言</div>
            <Select value={state.language} onValueChange={(v: any) => setState((s) => ({ ...s, language: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">英语 English</SelectItem>
                <SelectItem value="French">法语 French</SelectItem>
                <SelectItem value="German">德语 German</SelectItem>
                <SelectItem value="Spanish">西班牙语 Spanish</SelectItem>
                <SelectItem value="Japanese">日语 Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">3) 语气风格 / 受众 / 行业</div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <div className="text-sm">语气风格</div>
            <Select value={state.tone} onValueChange={(v: any) => setState((s) => ({ ...s, tone: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="友好有说服力">友好有说服力</SelectItem>
                <SelectItem value="高端优雅">高端优雅</SelectItem>
                <SelectItem value="大胆有冲击力">大胆有冲击力</SelectItem>
                <SelectItem value="极简直接">极简直接</SelectItem>
                <SelectItem value="俏皮幽默">俏皮幽默</SelectItem>
                <SelectItem value="专业可信">专业可信</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="text-sm">帖子受众</div>
              <Select value={state.audience} onValueChange={(v: any) => setState((s) => ({ ...s, audience: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="大众消费者">大众消费者</SelectItem>
                  <SelectItem value="价格敏感型用户">价格敏感型用户</SelectItem>
                  <SelectItem value="高端用户">高端用户</SelectItem>
                  <SelectItem value="送礼人群">送礼人群</SelectItem>
                  <SelectItem value="首次购买者">首次购买者</SelectItem>
                  <SelectItem value="老客户">老客户</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm">行业</div>
              <Select value={state.industry} onValueChange={(v: any) => setState((s) => ({ ...s, industry: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="美容">美容</SelectItem>
                  <SelectItem value="保健品">保健品</SelectItem>
                  <SelectItem value="护肤">护肤</SelectItem>
                  <SelectItem value="时尚">时尚</SelectItem>
                  <SelectItem value="电子产品">电子产品</SelectItem>
                  <SelectItem value="家居">家居</SelectItem>
                  <SelectItem value="宠物">宠物</SelectItem>
                  <SelectItem value="运动健身">运动健身</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">4) 产品信息</div>

        <div className="space-y-2">
          <div className="text-sm">品牌名（用于各平台用户名展示）</div>
          <Input
            value={state.brandName ?? ""}
            onChange={(e) => setState((s) => ({ ...s, brandName: e.target.value }))}
            placeholder="例如：Zoone"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm">产品名</div>
          <Input
            value={state.productName}
            onChange={(e) => setState((s) => ({ ...s, productName: e.target.value }))}
            placeholder="例如：Bluetooth Earplugs"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm">核心卖点（多条用换行）</div>
          <Textarea
            value={state.keySellingPoints}
            onChange={(e) => setState((s) => ({ ...s, keySellingPoints: e.target.value }))}
            rows={5}
            placeholder={"例如：\n- 高吸收\n- 日常能量支持\n- 适合忙碌人群"}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">5) 输出模式（只文案 or 文案+图片）</div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">同时生成图片</div>
            <div className="text-xs text-muted-foreground">勾选后会出现图片风格与上传入口。</div>
          </div>

          <input
            type="checkbox"
            className="h-5 w-5"
            checked={state.useImage}
            onChange={(e) => {
              const v = e.target.checked;
              setState((s) => ({ ...s, useImage: v, mode: v ? "text_and_image" : "text_only" }));
              if (!v) setFiles([]);
            }}
          />
        </div>

	{state.useImage ? (
  <div className="space-y-3">

    <div className="space-y-2">
      <div className="text-sm">图片风格</div>

      <Select
        value={state.imageStyle}
        onValueChange={(v) =>
          setState((s) => ({ ...s, imageStyle: v }))
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="明亮电商(干净棚拍)">电商商品图</SelectItem>
          <SelectItem value="自然真实(生活方式)">生活方式</SelectItem>
          <SelectItem value="高端质感">高端品牌</SelectItem>
          <SelectItem value="极简留白(高级排版)">极简高级</SelectItem>
          <SelectItem value="(暗调奢华)">暗调奢华</SelectItem>
          <SelectItem value="科技感(冷色未来)">科技产品</SelectItem>
          <SelectItem value="运动能量(动感硬朗)">运动风</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <div className="text-sm">上传产品图（1-3 张）</div>

      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) =>
          setFiles(Array.from(e.target.files || []).slice(0, 3))
        }
      />

      <div className="text-xs text-muted-foreground">
        最多 3 张。
      </div>
    </div>

  </div>
) : null}

      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">6) 发帖频率 & 周期</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm">每周发帖数量（1-7）</div>
            <Select value={String(state.postsPerWeek)} onValueChange={(v) => setState((s) => ({ ...s, postsPerWeek: Number(v) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }).map((_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm">时间周期（月 1-3）</div>
            <Select value={String(state.months)} onValueChange={(v) => setState((s) => ({ ...s, months: Number(v) }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">平台 {state.platforms.length}</Badge>
            <Badge variant="secondary">{state.language}</Badge>
            <Badge variant="secondary">{state.tone}</Badge>
            <Badge variant="secondary">{state.audience}</Badge>
            <Badge variant="secondary">{state.industry}</Badge>
          </div>

          <div className="relative group">
            <Button disabled={!canGenerate || loading} onClick={handleGenerate}>
              {loading ? "生成中..." : "生成帖子"}
            </Button>

            {!canGenerate && !loading ? (
              <div
                className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-[260px] opacity-0 translate-y-1
                           rounded-xl border bg-background shadow-lg px-3 py-2 text-xs leading-4
                           text-foreground transition
                           group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
              >
                <div className="font-medium">需要补充信息</div>
                <div className="mt-1 text-muted-foreground">
                  请填写：<span className="text-foreground">{missingFields.join("、")}</span>
                </div>
                <div className="absolute -top-1 right-4 h-2 w-2 rotate-45 border-l border-t bg-background" />
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progressText || "生成中…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-foreground" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
