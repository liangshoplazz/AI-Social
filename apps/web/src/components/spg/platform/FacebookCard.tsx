import { Card } from "@/components/ui/card";
import type { GeneratedPost } from "@/lib/spg-types";
import { IconGlobe, IconMore } from "./_icons";
import { PlatformLogo } from "./_platformLogo";
import { MediaBlock } from "./_mediaBlock";


export function FacebookCard({
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
<div className="flex items-start gap-3 px-4 py-3">
<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
  <PlatformLogo platform="facebook" className="h-5 w-5 text-muted-foreground" />
</div>

<div className="min-w-0 flex-1">
  <div className="text-sm font-semibold truncate">{name}</div>
  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
    <span>{post.scheduledDate}</span>
    <span>·</span>
    <IconGlobe className="h-4 w-4" />
  </div>
</div>

<IconMore className="h-5 w-5 text-muted-foreground" />
</div>

<div className="px-4 pb-3 text-sm whitespace-pre-line leading-5">{post.bodyText}</div>

<div className="px-4 pb-3">
<MediaBlock
  platform="facebook"
  imageUrl={post.imageUrl}
  imagePrompt={post.imagePrompt}
  sharedImageKey={post.sharedImageKey}
  referenceImageUrl={post.referenceImageUrl}
  autoGenerate={autoGenerate}
    onImageGenerated={(imageUrl) => onPostImageUpdate?.(post.id, imageUrl)}

  heightClass="h-[260px]"
/>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>👍 ❤️  1.2K</span>
          <span>128 comments · 56 shares</span>
        </div>

        <div className="mt-3 grid grid-cols-3 border-t pt-2 text-sm text-muted-foreground">
          <button className="py-2 hover:bg-muted rounded-lg">Like</button>
          <button className="py-2 hover:bg-muted rounded-lg">Comment</button>
          <button className="py-2 hover:bg-muted rounded-lg">Share</button>
        </div>
      </div>
    </Card>
  );
}
