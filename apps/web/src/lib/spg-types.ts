export type Platform = "instagram" | "facebook" | "x" | "pinterest";

export type Language =
  | "English"
  | "French"
  | "German"
  | "Spanish"
  | "Japanese";

export type Tone =
  | "友好有说服力"
  | "高端优雅"
  | "大胆有冲击力"
  | "极简直接"
  | "俏皮幽默"
  | "专业可信";

export type Audience =
  | "大众消费者"
  | "价格敏感型用户"
  | "高端用户"
  | "送礼人群"
  | "首次购买者"
  | "老客户";

export type Industry =
  | "美容"
  | "保健品"
  | "护肤"
  | "时尚"
  | "电子产品"
  | "家居"
  | "宠物"
  | "运动健身";

export type ImageStyle =
  | "自然真实(生活方式)"
  | "高端质感"
  | "暗调奢华"
  | "明亮电商(干净棚拍)"
  | "科技感(冷色未来)"
  | "清新自然(植物光感)"
  | "运动能量(动感硬朗)"
  | "可爱卡通(软萌插画)"
  | "极简留白(高级排版)";

export type GenerateMode = "text_only" | "text_and_image";

export type FormState = {
  platforms: Platform[];
  language: Language;
  tone: Tone;
  audience: Audience;
  industry: Industry;
  productName: string;
  keySellingPoints: string;
  needHashtags: boolean;

  mode: GenerateMode;

  // image
  useImage: boolean;
  imageStyle: ImageStyle;

  // schedule
  postsPerWeek: number; // 1-7
  months: number; // 1-3

  market: string; // e.g., US/UK/FR/DE/ES/JP
};

export type GeneratedPost = {
  id: string;
  platform: Platform;
  scheduledDate: string; // YYYY-MM-DD
  title?: string;
  bodyText: string;
  hashtags: string[];
  imagePrompt?: string;
  imageUrl?: string;
};

export type GenerateResponse = {
  taskId: string;
  startDate: string;
  endDate: string;
  posts: GeneratedPost[];
};
