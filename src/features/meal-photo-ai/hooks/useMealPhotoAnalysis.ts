import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { useWolfAIUsage } from "@/src/features/wolf-ai/hooks/useWolfAIUsage";

import { MEAL_PHOTO_AI_ERROR_MESSAGES, MEAL_PHOTO_AI_FEATURE } from "../constants";
import { analyzeMealPhoto } from "../services/mealPhotoAI.service";
import {
  MealPhotoAIError,
  type MealPhotoCategoryValue,
  type MealPhotoAnalyzeResponse,
  type MealPhotoUploadImage,
} from "../types";

function buildErrorFromResponse(response: MealPhotoAnalyzeResponse | null): MealPhotoAIError | null {
  if (!response || response.code === "OK") return null;

  switch (response.code) {
    case "LIMIT_REACHED":
      return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.limitReached, "LIMIT_REACHED");
    case "UNSUPPORTED_IMAGE":
      return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.unsupportedImage, "UNSUPPORTED_IMAGE");
    case "ANALYSIS_FAILED":
      return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed, "ANALYSIS_FAILED");
    default:
      return new MealPhotoAIError(MEAL_PHOTO_AI_ERROR_MESSAGES.analysisFailed, "INTERNAL_ERROR");
  }
}

export function useMealPhotoAnalysis() {
  const queryClient = useQueryClient();
  const usageQuery = useWolfAIUsage(MEAL_PHOTO_AI_FEATURE);
  const mutation = useMutation({
    mutationFn: async (input: { image: MealPhotoUploadImage; mealCategory?: MealPhotoCategoryValue | null }) => {
      return analyzeMealPhoto(input);
    },
    onSuccess: async (response) => {
      queryClient.setQueryData(usageQuery.queryKey, response.usage);
      await queryClient.invalidateQueries({ queryKey: usageQuery.queryKey });
    },
  });

  const response = mutation.data ?? null;
  const derivedError = useMemo(() => buildErrorFromResponse(response), [response]);
  const error = mutation.error instanceof MealPhotoAIError ? mutation.error : derivedError;

  useEffect(() => {
    if (!__DEV__ || !error) return;

    console.error("[Meal Photo AI]", "Analysis request failed", {
      code: error.code,
      message: error.message,
    });
  }, [error]);

  return {
    analyze: (image: MealPhotoUploadImage, mealCategory?: MealPhotoCategoryValue | null) =>
      mutation.mutateAsync({ image, mealCategory }),
    cached: response?.cached ?? false,
    data: response?.data ?? null,
    error,
    isAnalyzing: mutation.isPending,
    reset: mutation.reset,
    safetyCategory: response?.safetyCategory ?? null,
    usedFallback: response?.usedFallback ?? false,
    usage: response?.usage ?? null,
  };
}
