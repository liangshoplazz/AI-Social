import { Card } from "@/components/ui/card";
import type { GeneratedPost } from "@/lib/spg-types";
import { PlatformLogo } from "./_platformLogo";
import { MediaBlock } from "./_mediaBlock";

export function PinterestCard({
  post,
  autoGenerate = false,
  onPostImageUpdate,
}: {
  post: GeneratedPost;
  autoGenerate?: boolean;
  onPostImageUpdate?: (postId: string, imageUrl: string) => void;
}) {

  const name = post.brandName || "Brand";

  return (
    <Card className="w-[340px] overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <PlatformLogo platform="pinterest" className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-[12px] text-muted-foreground">{post.scheduledDate}</div>
          </div>
        </div>

        <button className="rounded-full bg-red-600 px-3 py-1 text-[12px] font-semibold text-white">Save</button>
      </div>

      <div className="px-4 pb-3">

<MediaBlock
  platform="pinterest"
  imageUrl={post.imageUrl}
  imagePrompt={post.imagePrompt}
  sharedImageKey={post.sharedImageKey}
  referenceImageUrl={post.referenceImageUrl}
  autoGenerate={autoGenerate}
  onImageGenerated={(imageUrl) => onPostImageUpdate?.(post.id, imageUrl)}
  heightClass="h-[260px]"
/>

      </div>

      <div className="p-4 space-y-2">
        {post.title ? <div className="text-[15px] font-semibold leading-5">{post.title}</div> : null}
        <div className="text-sm whitespace-pre-line max-h-28 overflow-auto leading-5">{post.bodyText}</div>
        <div className="pt-2">
          <button className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-muted">Visit</button>
        </div>
      </div>
    </Card>
  );
}
