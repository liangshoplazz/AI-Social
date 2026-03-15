import { Card } from "@/components/ui/card";
import type { GeneratedPost } from "@/lib/spg-types";
import { IconBookmark, IconComment, IconHeart, IconMore, IconSend } from "./_icons";
import { PlatformLogo } from "./_platformLogo";
import { MediaBlock } from "./_mediaBlock";

export function InstagramCard({
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
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <PlatformLogo platform="instagram" className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold truncate">{name}</div>
            <span className="text-[11px] text-muted-foreground">• Sponsored</span>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{post.scheduledDate}</div>
        </div>

        <IconMore className="h-5 w-5 text-muted-foreground" />
      </div>


      <div className="px-4 pb-3">
	<MediaBlock
  platform="instagram"
  imageUrl={post.imageUrl}
  imagePrompt={post.imagePrompt}
  sharedImageKey={post.sharedImageKey}
  referenceImageUrl={post.referenceImageUrl}
  autoGenerate={autoGenerate}
  onImageGenerated={(imageUrl) => onPostImageUpdate?.(post.id, imageUrl)}
  heightClass="h-[260px]"
/>
    </div>


      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IconHeart className="h-6 w-6" />
            <IconComment className="h-6 w-6" />
            <IconSend className="h-6 w-6" />
          </div>
          <IconBookmark className="h-6 w-6" />
        </div>

        <div className="mt-2 text-[13px] font-semibold">Liked by <span className="font-semibold">your audience</span> and others</div>

        <div className="mt-2 text-sm whitespace-pre-line leading-5">
          <span className="font-semibold">{name}</span>{" "}
          {post.bodyText}
        </div>

        {post.hashtags?.length ? (
          <div className="mt-2 text-sm text-[#1d4ed8]">
            {post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
          </div>
        ) : null}

        <div className="mt-3 pb-4 text-[12px] text-muted-foreground">View all comments</div>
      </div>
    </Card>
  );
}
