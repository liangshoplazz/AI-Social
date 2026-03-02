"use client";

import { useMemo, useState } from "react";
import type { FormState, GenerateResponse, Platform } from "@/lib/spg-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X" },
  { key: "pinterest", label: "Pinterest" },
];

export function FormPanel({ onGenerated }: { onGenerated: (res: GenerateResponse) => void }) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [state, setState] = useState<FormState>({
    platforms: ["instagram"],
    language: "English",
    tone: "友好有说服力",
    audience: "大众消费者",
    industry: "保健品",
    productName: "Zoone CoQ10",
    keySellingPoints: "核心卖点：高吸收、日常心脏能量支持、适合忙碌人群。",
    needHashtags: true,
    mode: "text_only",
    useImage: false,
    imageStyle: "高端质感",
    postsPerWeek: 3,
    months: 2,
    market: "US",
  });

  const canGenerate = useMemo(() => {
    if (!state.platforms.length) return false;
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

    try {
      let res: Response;

      // useImage + files => multipart/form-data
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
        // 用 alert 兜底（即便 toast 组件没装也能看见）
        if (typeof window !== "undefined") alert(msg);
        throw new Error(msg);
      }

      // 显示 warning（比如 DeepSeek 余额不足 -> 自动 Mock）
      if (data?.warning) {
        try {
          const { toast } = await import("@/components/ui/use-toast");
          toast.toast({
            title: "提示",
            description: String(data.warning),
          });
        } catch {
          if (typeof window !== "undefined") alert(String(data.warning));
        }
      }

      onGenerated(data as GenerateResponse);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="text-base font-semibold">社媒帖子生成器</div>
        <div className="text-xs text-muted-foreground">
          选择平台/语言/风格/受众/行业，输入产品信息，即可生成海外风格的发帖计划（按月份横向展示）。
        </div>
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
          <div className="text-sm">产品名</div>
          <Input
            value={state.productName}
            onChange={(e) => setState((s) => ({ ...s, productName: e.target.value }))}
            placeholder="例如：Zoone CoQ10"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm">核心卖点（多条用换行）</div>
          <Textarea
            value={state.keySellingPoints}
            onChange={(e) => setState((s) => ({ ...s, keySellingPoints: e.target.value }))}
            rows={5}
            placeholder={'例如：\n- 高吸收\n- 日常能量支持\n- 适合忙碌人群'}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Hashtag</div>
            <div className="text-xs text-muted-foreground">是否让 AI 自动生成推荐标签</div>
          </div>

          {/* 原生 checkbox，保证可点击 */}
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={state.needHashtags}
            onChange={(e) => setState((s) => ({ ...s, needHashtags: e.target.checked }))}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">5) 输出模式（只文案 or 文案+图片）</div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">同时生成图片</div>
            <div className="text-xs text-muted-foreground">
              勾选后会出现图片风格与上传入口（后端将接 removebg + 即梦）。
            </div>
          </div>

          {/* 原生 checkbox，保证可点击 */}
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={state.useImage}
            onChange={(e) => {
              const v = e.target.checked;
              setState((s) => ({
                ...s,
                useImage: v,
                mode: v ? "text_and_image" : "text_only",
              }));
              if (!v) setFiles([]);
            }}
          />
        </div>

        {state.useImage ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm">图片风格</div>
              <Select value={state.imageStyle} onValueChange={(v: any) => setState((s) => ({ ...s, imageStyle: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="自然真实(生活方式)">自然真实(生活方式)</SelectItem>
                  <SelectItem value="高端质感">高端质感</SelectItem>
                  <SelectItem value="暗调奢华">暗调奢华</SelectItem>
                  <SelectItem value="明亮电商(干净棚拍)">明亮电商(干净棚拍)</SelectItem>
                  <SelectItem value="科技感(冷色未来)">科技感(冷色未来)</SelectItem>
                  <SelectItem value="清新自然(植物光感)">清新自然(植物光感)</SelectItem>
                  <SelectItem value="运动能量(动感硬朗)">运动能量(动感硬朗)</SelectItem>
                  <SelectItem value="可爱卡通(软萌插画)">可爱卡通(软萌插画)</SelectItem>
                  <SelectItem value="极简留白(高级排版)">极简留白(高级排版)</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-xs text-muted-foreground">
                MVP 阶段：先上传 1-3 张产品图并提交给后端。后端将扣图（removebg）+ 二创（即梦），并返回 imageUrl。
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm">上传产品图（1-3 张）</div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const list = Array.from(e.target.files || []).slice(0, 3);
                  setFiles(list);
                }}
              />
              <div className="text-xs text-muted-foreground">建议：主图清晰、背景干净或场景图都可以。最多 3 张。</div>

              {files.length ? (
                <div className="text-xs text-muted-foreground">
                  已选择：{files.map((f) => f.name).join(", ")}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">未选择图片（只会生成图片 prompt，不会上传图片）。</div>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">6) 发帖频率 & 周期</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-sm">每周发帖数量（1-7）</div>
            <Select
              value={String(state.postsPerWeek)}
              onValueChange={(v) => setState((s) => ({ ...s, postsPerWeek: Number(v) }))}
            >
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

        <div className="text-xs text-muted-foreground">以生成当天起计算（后端会生成计划日期并按月份分组展示）。</div>
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

          <Button disabled={!canGenerate || loading} onClick={handleGenerate}>
            {loading ? "生成中..." : "生成帖子"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
