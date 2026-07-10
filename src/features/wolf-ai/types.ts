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

export type WolfAISafetyCategory =
  | "allowed"
  | "dehydration"
  | "eating_disorder"
  | "emergency"
  | "extreme_diet"
  | "injury"
  | "medical"
  | "ped";

export type WolfAIRecoverySuggestion = {
  actions: string[];
  reasons: string[];
  status: "moderate" | "ready" | "recovery_first";
  summary: string;
  title: string;
};

export type WolfAINutritionSuggestion = {
  calorieDirection: string;
  carbohydrateGuidance: string;
  hydrationGuidance: string;
  postWorkoutAction: string | null;
  proteinGuidance: string;
  summary: string;
  title: string;
};

export type WolfAIDailyGoalInsight = {
  action: string;
  message: string;
  title: string;
  tone: "consistency" | "motivating" | "recovery";
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
  isLimitReached: boolean;
  limit: number;
  remaining: number;
  tier: WolfAITier;
  used: number;
};

export type WolfAISuggestionHookResult<TData> = {
  cached: boolean;
  data: TData | null;
  error: WolfAIError | null;
  isLoading: boolean;
  isLimitReached: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  safetyCategory: WolfAISafetyCategory | null;
  usedFallback: boolean;
  usage: WolfAIUsageResponse | null;
};

export type WolfAIGenerateResponse<TData> = {
  code?: "LIMIT_REACHED" | "OK";
  cached: boolean;
  data: TData;
  feature: WolfAIFeature;
  generatedForDate: string;
  safetyCategory: WolfAISafetyCategory;
  usedFallback: boolean;
  usage: {
    isLimitReached: boolean;
    limit: number;
    remaining: number;
    tier: WolfAITier;
    used: number;
  };
};
