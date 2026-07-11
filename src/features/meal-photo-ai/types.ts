import type { WolfAIUsageResponse } from "@/src/features/wolf-ai/types";

export type MealPhotoConfidence = "high" | "low" | "medium";

export type MealPhotoCategoryValue =
  | "breakfast"
  | "dinner"
  | "lunch"
  | "other"
  | "post_workout"
  | "pre_workout"
  | "snack";

export type MealPhotoSafetyCategory =
  | "alcohol"
  | "allowed"
  | "eating_disorder"
  | "extreme_diet"
  | "medical"
  | "not_meal"
  | "supplement"
  | "unclear";

export type MealPhotoItem = {
  calories: number;
  carbs: number;
  confidence: MealPhotoConfidence;
  estimatedQuantity: number | null;
  fat: number;
  id: string;
  name: string;
  protein: number;
  servingUnit: string | null;
};

export type MealPhotoTotals = {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
};

export type MealPhotoAnalysis = {
  assumptions: string[];
  confidence: MealPhotoConfidence;
  items: MealPhotoItem[];
  mealName: string;
  totals: MealPhotoTotals;
  warnings: string[];
};

export type MealPhotoDraftItemField = "calories" | "carbs" | "estimatedQuantity" | "fat" | "name" | "protein" | "servingUnit";

export type MealPhotoDraftItem = {
  calories: string;
  carbs: string;
  estimatedQuantity: string;
  fat: string;
  id: string;
  name: string;
  protein: string;
  servingUnit: string;
};

export type MealPhotoDraft = {
  items: MealPhotoDraftItem[];
  mealCategory: string;
  mealName: string;
};

export type MealPhotoDraftItemErrors = Partial<Record<MealPhotoDraftItemField, string>>;

export type MealPhotoDraftErrors = {
  form?: string;
  items: Record<string, MealPhotoDraftItemErrors>;
  mealCategory?: string;
  mealName?: string;
};

export type MealPhotoDraftTotals = {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
};

export type MealPhotoAnalyzeCode = "ANALYSIS_FAILED" | "LIMIT_REACHED" | "OK" | "UNSUPPORTED_IMAGE";

export type MealPhotoAnalyzeResponse = {
  cached: boolean;
  code: MealPhotoAnalyzeCode;
  data: MealPhotoAnalysis;
  safetyCategory?: MealPhotoSafetyCategory;
  usedFallback: boolean;
  usage: WolfAIUsageResponse;
};

export type MealPhotoUploadImage = {
  height: number | null;
  mimeType: string;
  name: string;
  size: number | null;
  uri: string;
  width: number | null;
};

export type MealPhotoAIErrorCode =
  | "ANALYSIS_FAILED"
  | "INTERNAL_ERROR"
  | "INVALID_IMAGE"
  | "LIMIT_REACHED"
  | "NETWORK_ERROR"
  | "PERMISSION_DENIED"
  | "PICKER_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "UNSUPPORTED_IMAGE";

export class MealPhotoAIError extends Error {
  code: MealPhotoAIErrorCode;

  constructor(message: string, code: MealPhotoAIErrorCode = "INTERNAL_ERROR") {
    super(message);
    this.code = code;
    this.name = "MealPhotoAIError";
  }
}
