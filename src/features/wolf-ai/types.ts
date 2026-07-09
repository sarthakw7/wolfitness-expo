export type WolfAIFeature = "daily_goal" | "nutrition" | "recovery";
export type WolfAITier = "elite" | "free" | "pro";

export type WolfAIUsageState = {
  feature: WolfAIFeature;
  isLimitReached: boolean;
  limit: number;
  remaining: number;
  tier: WolfAITier;
  usageDate: string;
  used: number;
};

export type WolfAIErrorCode =
  | "BAD_REQUEST"
  | "GUARDRAIL"
  | "INTERNAL_ERROR"
  | "LIMIT_REACHED"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "UNAUTHORIZED";

export class WolfAIError extends Error {
  code: WolfAIErrorCode;

  constructor(message: string, code: WolfAIErrorCode = "INTERNAL_ERROR") {
    super(message);
    this.code = code;
    this.name = "WolfAIError";
  }
}

export type WolfAIUsageResponse = {
  limit: number;
  remaining: number;
  tier: WolfAITier;
  used: number;
};

export type WolfAIGenerateResponse<TData> = {
  cached: boolean;
  data: TData;
  feature: WolfAIFeature;
  generatedForDate: string;
  safetyCategory: string;
  usedFallback: boolean;
  usage: {
    limit: number;
    remaining: number;
    tier: WolfAITier;
    used: number;
  };
};
