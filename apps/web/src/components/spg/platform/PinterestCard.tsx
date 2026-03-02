import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GeneratedPost } from "@/lib/spg-types";

export function PinterestCard({ post }: { post: GeneratedPost }) {
  return (
    <Card className="w-[340px] overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <div className="text-sm font-semibold">Zoone Ideas</div>
          <div className="text-xs text-muted-foreground">{post.scheduledDate}</div>
        </div>
        <Badge variant="secondary">Pinterest</Badge>
      </div>

      <div className="bg-muted w-full h-[420px] flex items-center justify-center text-xs text-muted-foreground">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span>Pin Image</span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {post.title ? <div className="font-semibold">{post.title}</div> : null}
        <div className="text-sm line-clamp-3 whitespace-pre-line">{post.bodyText}</div>
      </div>
    </Card>
  );
}
