export type Platform = "instagram" | "facebook" | "x" | "pinterest";

export type GenerateMode = "text_only" | "text_and_image";

export type FormState = {
  brandName?: string;
  avatarUrl?: string;
  platforms: Platform[];
  market: string;
  language: string;
  tone: string;
  audience: string;
  industry: string;

  // only one brand field for UI simulation

  productName: string;
  keySellingPoints: string;

  // legacy (kept optional for backward compatibility)
  needHashtags?: boolean;

  mode: GenerateMode;
  useImage: boolean;
  imageStyle: string;

  postsPerWeek: number;
  months: number;
};

export type GeneratedPost = {
  brand?: {
    name: string;
    avatarUrl?: string;
    handle?: string;
  };
  id: string;
  platform: Platform;
  scheduledDate: string; // YYYY-MM-DD

  title?: string;
  bodyText: string;

  hashtags?: string[];
  imagePrompt?: string;
  imageUrl?: string;
  sharedImageKey?: string;
  referenceImageUrl?: string;

  // snapshot brand name
  brandName?: string;
};

export type GenerateResponse = {
  taskId: string;
  platforms?: Platform[];
  startDate: string;
  endDate: string;
  posts: GeneratedPost[];
  warning?: string;
};
