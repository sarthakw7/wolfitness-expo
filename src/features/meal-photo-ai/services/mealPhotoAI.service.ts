import { supabase } from "@/src/lib/supabase";
import { buildWolfitnessApiUrl } from "@/src/config/apiUrls";

import { MEAL_PHOTO_AI_ERROR_MESSAGES } from "../constants";
import {
  MealPhotoAIError,
  type MealPhotoCategoryValue,
  type MealPhotoAIErrorCode,
  type MealPhotoAnalyzeCode,
  type MealPhotoAnalyzeResponse,
  type MealPhotoUploadImage,
  type MealPhotoConfidence,
  type MealPhotoItem,
  type MealPhotoSafetyCategory,
  type MealPhotoTotals,
} from "../types";
import { isMealPhotoUploadTooLarge } from "../lib/mealPhotoImage";

function normalizeError(error: unknown): MealPhotoAIError {
  if (error instanceof MealPhotoAIError) return error;

  if (error instanceof TypeError) {
    return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.network, "NETWORK_ERROR");
  }

  if (error instanceof Error) {
    return new MealPhotoAIError(error.message || MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed, "INTERNAL_ERROR");
  }

  return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed, "INTERNAL_ERROR");
}

async function resolveSession() {
  const initialSession = await supabase.auth.getSession();
  if (initialSession.error) {
    throw initialSession.error;
  }

  if (initialSession.data.session?.access_token) {
    return initialSession.data.session;
  }

  if (__DEV__) {
    console.info("[Meal Photo AI]", "Refreshing session before analysis.");
  }

  const refreshedSession = await supabase.auth.refreshSession();
  if (refreshedSession.error) {
    throw refreshedSession.error;
  }

  if (refreshedSession.data.session?.access_token) {
    return refreshedSession.data.session;
  }

  const retrySession = await supabase.auth.getSession();
  if (retrySession.error) {
    throw retrySession.error;
  }

  if (retrySession.data.session?.access_token) {
    return retrySession.data.session;
  }

  throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.unauthorized, "UNAUTHORIZED");
}

function isMealPhotoConfidence(value: unknown): value is MealPhotoConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isMealPhotoSafetyCategory(value: unknown): value is MealPhotoSafetyCategory {
  return (
    value === "allowed" ||
    value === "alcohol" ||
    value === "eating_disorder" ||
    value === "extreme_diet" ||
    value === "medical" ||
    value === "not_meal" ||
    value === "supplement" ||
    value === "unclear"
  );
}

function isMealPhotoItem(value: unknown): value is MealPhotoItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MealPhotoItem>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.calories === "number" &&
    typeof candidate.protein === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fat === "number" &&
    isMealPhotoConfidence(candidate.confidence) &&
    (typeof candidate.estimatedQuantity === "number" || candidate.estimatedQuantity === null) &&
    (typeof candidate.servingUnit === "string" || candidate.servingUnit === null)
  );
}

function isMealPhotoTotals(value: unknown): value is MealPhotoTotals {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MealPhotoTotals>;
  return (
    typeof candidate.calories === "number" &&
    typeof candidate.protein === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fat === "number"
  );
}

function parseMealPhotoResponse(input: unknown): MealPhotoAnalyzeResponse | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<MealPhotoAnalyzeResponse> & {
    data?: unknown;
    usage?: unknown;
  };

  if (
    candidate.code !== "OK" &&
    candidate.code !== "LIMIT_REACHED" &&
    candidate.code !== "UNSUPPORTED_IMAGE" &&
    candidate.code !== "ANALYSIS_FAILED"
  ) {
    return null;
  }

  if (!candidate.data || typeof candidate.data !== "object") return null;
  const data = candidate.data as {
    assumptions?: unknown;
    confidence?: unknown;
    items?: unknown;
    mealName?: unknown;
    totals?: unknown;
    warnings?: unknown;
  };

  if (
    typeof data.mealName !== "string" ||
    !isMealPhotoConfidence(data.confidence) ||
    !Array.isArray(data.items) ||
    !data.items.every(isMealPhotoItem) ||
    !isMealPhotoTotals(data.totals) ||
    !Array.isArray(data.assumptions) ||
    !data.assumptions.every((value) => typeof value === "string") ||
    !Array.isArray(data.warnings) ||
    !data.warnings.every((value) => typeof value === "string")
  ) {
    return null;
  }

  if (!candidate.usage || typeof candidate.usage !== "object") return null;
  const usage = candidate.usage as {
    isLimitReached?: unknown;
    limit?: unknown;
    remaining?: unknown;
    tier?: unknown;
    used?: unknown;
  };

  if (
    typeof usage.limit !== "number" ||
    typeof usage.remaining !== "number" ||
    typeof usage.tier !== "string" ||
    typeof usage.used !== "number"
  ) {
    return null;
  }

  const payload: MealPhotoAnalyzeResponse = {
    cached: Boolean(candidate.cached),
    code: candidate.code,
    data: {
      assumptions: data.assumptions,
      confidence: data.confidence,
      items: data.items,
      mealName: data.mealName,
      totals: data.totals,
      warnings: data.warnings,
    },
    safetyCategory: isMealPhotoSafetyCategory(candidate.safetyCategory) ? candidate.safetyCategory : undefined,
    usedFallback: Boolean(candidate.usedFallback),
    usage: {
      isLimitReached: Boolean(usage.isLimitReached) || usage.remaining <= 0,
      limit: usage.limit,
      remaining: usage.remaining,
      tier: usage.tier as MealPhotoAnalyzeResponse["usage"]["tier"],
      used: usage.used,
    },
  };

  return payload;
}

function buildFormData(image: MealPhotoUploadImage, mealCategory?: string | null) {
  const formData = new FormData();
  formData.append("image", {
    name: image.name,
    type: image.mimeType,
    uri: image.uri,
  } as never);

  const normalizedMealCategory = mealCategory?.trim();
  if (normalizedMealCategory) {
    formData.append("mealCategory", normalizedMealCategory);
  }

  return formData;
}

function getMealPhotoErrorMessage(code: MealPhotoAnalyzeCode | MealPhotoAIErrorCode, fallback?: string) {
  switch (code) {
    case "LIMIT_REACHED":
      return MEAL_PHOTO_AI_ERROR_MESSAGES.limitReached;
    case "UNSUPPORTED_IMAGE":
      return MEAL_PHOTO_AI_ERROR_MESSAGES.unsupportedImage;
    case "ANALYSIS_FAILED":
      return fallback || MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed;
    case "OK":
    default:
      return fallback || MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed;
  }
}

export async function analyzeMealPhoto(input: {
  image: MealPhotoUploadImage;
  mealCategory?: MealPhotoCategoryValue | null;
}): Promise<MealPhotoAnalyzeResponse> {
  const session = await resolveSession();
  const requestUrl = buildWolfitnessApiUrl("/api/wolf-ai/meal-photo/analyze");

  if (__DEV__) {
    console.info("[Meal Photo AI]", "Request start", {
      hasAccessToken: Boolean(session.access_token),
      imageSize: input.image.size,
      mealCategory: input.mealCategory ?? null,
      requestUrl,
    });
  }

  const response = await fetch(requestUrl, {
    body: buildFormData(input.image, input.mealCategory),
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  }).catch((error) => {
    throw normalizeError(error);
  });

  const payload = await response.json().catch(() => null);
  const parsed = parseMealPhotoResponse(payload);

  if (__DEV__) {
    console.info("[Meal Photo AI]", "Response received", {
      backendCode: payload?.code ?? null,
      responseStatus: response.status,
    });
  }

  if (response.status === 401 || payload?.code === "UNAUTHORIZED") {
    throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.unauthorized, "UNAUTHORIZED");
  }

  if (parsed) {
    return parsed;
  }

  if (!response.ok) {
    const errorCode: MealPhotoAIErrorCode =
      payload?.code === "LIMIT_REACHED" ||
      payload?.code === "UNSUPPORTED_IMAGE" ||
      payload?.code === "ANALYSIS_FAILED" ||
      payload?.code === "INTERNAL_ERROR" ||
      payload?.code === "NETWORK_ERROR" ||
      payload?.code === "UNAUTHORIZED" ||
      payload?.code === "INVALID_IMAGE" ||
      payload?.code === "PERMISSION_DENIED"
        ? payload.code
        : "ANALYSIS_FAILED";

    throw new MealPhotoAIError(
      getMealPhotoErrorMessage(errorCode, payload?.message),
      errorCode,
    );
  }

  throw new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed, "INTERNAL_ERROR");
}

export function shouldBlockMealPhotoAnalysis(image: MealPhotoUploadImage) {
  return isMealPhotoUploadTooLarge(image);
}
