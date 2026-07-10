import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/src/hooks/useAuth";

import { WOLF_AI_QUERY_KEYS } from "../constants";
import { generateWolfAI } from "../services/wolfAI.service";
import type {
  WolfAIFeature,
  WolfAIGenerateResponse,
  WolfAIError,
  WolfAISafetyCategory,
  WolfAISuggestionHookResult,
} from "../types";

function isLimitReached(error: WolfAIError | null, usage: WolfAIGenerateResponse<unknown>["usage"] | null) {
  if (error?.code === "LIMIT_REACHED") return true;
  if (!usage) return false;
  return usage.isLimitReached || usage.remaining <= 0;
}

export function useWolfAISuggestion<TData>(feature: WolfAIFeature): WolfAISuggestionHookResult<TData> {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const queryKey = userId ? WOLF_AI_QUERY_KEYS.suggestion(userId, feature) : (["wolf-ai", "suggestion", "anonymous", feature] as const);
  const usageQueryKey = userId ? WOLF_AI_QUERY_KEYS.usage(userId, feature) : null;
  const aggregateUsageQueryKey = userId ? WOLF_AI_QUERY_KEYS.usage(userId) : null;

  const suggestionQuery = useQuery({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      if (__DEV__) {
        console.info("[Wolf AI]", "Suggestion request start", {
          feature,
          hasUserId: Boolean(userId),
          userId,
        });
      }

      return generateWolfAI<TData>({ feature });
    },
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60 * 15,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (__DEV__) {
        console.info("[Wolf AI]", "Suggestion refresh start", {
          feature,
          hasUserId: Boolean(userId),
          userId,
        });
      }

      return generateWolfAI<TData>({ feature, forceRefresh: true });
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKey, data);
      if (usageQueryKey) {
        await queryClient.invalidateQueries({ queryKey: usageQueryKey });
      }
      if (aggregateUsageQueryKey) {
        await queryClient.invalidateQueries({ queryKey: aggregateUsageQueryKey });
      }
    },
  });

  const error = (refreshMutation.error ?? suggestionQuery.error ?? null) as WolfAIError | null;
  const data = suggestionQuery.data?.data ?? null;
  const usage = suggestionQuery.data?.usage ?? null;
  const safetyCategory = (suggestionQuery.data?.safetyCategory ?? null) as WolfAISafetyCategory | null;

  useEffect(() => {
    const activeError = (refreshMutation.error ?? suggestionQuery.error ?? null) as WolfAIError | null;
    if (!__DEV__ || !activeError) return;

    console.error("[Wolf AI]", "Suggestion request failed", {
      code: activeError.code,
      feature,
      message: activeError.message,
      userId,
    });
  }, [feature, refreshMutation.error, suggestionQuery.error, userId]);

  return {
    cached: suggestionQuery.data?.cached ?? false,
    data,
    error,
    isLoading: suggestionQuery.isLoading,
    isLimitReached: isLimitReached(error, usage),
    isRefreshing: refreshMutation.isPending,
    refresh: async () => {
      refreshMutation.reset();
      await refreshMutation.mutateAsync();
    },
    safetyCategory,
    usedFallback: suggestionQuery.data?.usedFallback ?? false,
    usage,
  };
}
