import { Card } from "@/components/ui/card";
import type { GeneratedPost } from "@/lib/spg-types";
import { IconComment, IconHeart, IconMore, IconRetweet, IconShare } from "./_icons";
import { PlatformLogo } from "./_platformLogo";
import { MediaBlock } from "./_mediaBlock";

export function XCard({
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
      <div className="flex gap-3 px-4 py-3">
        <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
          <PlatformLogo platform="x" className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{name}</span>
                <span className="text-[13px] text-muted-foreground truncate">@{name.replace(/\s+/g, "").toLowerCase()}</span>
                <span className="text-[13px] text-muted-foreground">·</span>
                <span className="text-[13px] text-muted-foreground">{post.scheduledDate}</span>
              </div>
            </div>
            <IconMore className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="mt-2 text-sm whitespace-pre-line leading-5">{post.bodyText}</div>

          <div className="mt-3">
<MediaBlock
  platform="x"
  imageUrl={post.imageUrl}
  imagePrompt={post.imagePrompt}
  sharedImageKey={post.sharedImageKey}
  referenceImageUrl={post.referenceImageUrl}
  autoGenerate={autoGenerate}
  onImageGenerated={(imageUrl) => onPostImageUpdate?.(post.id, imageUrl)}
  heightClass="h-[260px]"
/>
          </div>

          <div className="mt-3 flex items-center justify-between text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconComment className="h-4 w-4" />
              <span>24</span>
            </div>
            <div className="flex items-center gap-2">
              <IconRetweet className="h-4 w-4" />
              <span>12</span>
            </div>
            <div className="flex items-center gap-2">
              <IconHeart className="h-4 w-4" />
              <span>128</span>
            </div>
            <div className="flex items-center gap-2">
              <IconShare className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
