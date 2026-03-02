import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GeneratedPost } from "@/lib/spg-types";

export function FacebookCard({ post }: { post: GeneratedPost }) {
  return (
    <Card className="w-[340px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Zoone Supplement</div>
          <div className="text-xs text-muted-foreground">{post.scheduledDate}</div>
        </div>
        <Badge variant="secondary">Facebook</Badge>
      </div>

      <div className="p-3 space-y-2">
        {post.title ? <div className="font-semibold">{post.title}</div> : null}
        <div className="text-sm whitespace-pre-line">{post.bodyText}</div>
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="w-full rounded-md border object-cover" />
        ) : (
          <div className="w-full h-40 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
            Image Preview
          </div>
        )}
        <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>
    </Card>
  );
}
