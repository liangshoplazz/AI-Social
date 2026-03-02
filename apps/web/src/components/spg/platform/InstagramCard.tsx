import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GeneratedPost } from "@/lib/spg-types";

export function InstagramCard({ post }: { post: GeneratedPost }) {
  return (
    <Card className="w-[340px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="text-sm font-semibold">zoone.official</div>
          <div className="text-xs text-muted-foreground">{post.scheduledDate}</div>
        </div>
        <Badge variant="secondary">Instagram</Badge>
      </div>

      <div className="bg-muted aspect-square w-full flex items-center justify-center text-xs text-muted-foreground">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>Image Preview</span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="text-sm whitespace-pre-line">{post.bodyText}</div>
        {post.hashtags?.length ? (
          <div className="text-xs text-blue-600">
            {post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
