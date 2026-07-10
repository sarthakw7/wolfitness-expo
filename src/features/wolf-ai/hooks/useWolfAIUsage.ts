import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/hooks/useAuth";

import { WOLF_AI_QUERY_KEYS, WOLF_AI_TIER_LIMITS } from "../constants";
import type { WolfAIFeature, WolfAIError, WolfAITier, WolfAIUsageState } from "../types";

function resolveTierLimit(tier: string | null | undefined): { limit: number; tier: WolfAITier } {
  switch (tier) {
    case "pro":
      return { limit: WOLF_AI_TIER_LIMITS.pro, tier: "pro" };
    case "elite":
      return { limit: WOLF_AI_TIER_LIMITS.elite, tier: "elite" };
    case "free":
    default:
      return { limit: WOLF_AI_TIER_LIMITS.free, tier: "free" };
  }
}

function getLocalIsoDate(timeZone: string | null | undefined) {
  const zone = timeZone?.trim() || "UTC";

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: zone,
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    return `${year}-${month}-${day}`;
  } catch {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  }
}

export function useWolfAIUsage(feature?: WolfAIFeature) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryKey = userId ? WOLF_AI_QUERY_KEYS.usage(userId, feature ?? "all") : ["wolf-ai", "usage", "anonymous", feature ?? "all"];

  const query = useQuery<WolfAIUsageState>({
    enabled: Boolean(userId),
    queryKey,
    queryFn: async () => {
      if (!userId) {
        throw new Error("Not authenticated.");
      }

      const entitlementRes = await supabase.from("ai_entitlements").select("tier,status,timezone").eq("user_id", userId).maybeSingle();
      if (entitlementRes.error && entitlementRes.status !== 406) throw entitlementRes.error;

      const tierResult = resolveTierLimit(
        entitlementRes.data?.status === "active" || entitlementRes.data?.status === "trial" ? entitlementRes.data?.tier : "free",
      );
      const usageDate = getLocalIsoDate(entitlementRes.data?.timezone ?? null);

      let usageQuery = supabase
        .from("ai_usage_daily")
        .select("consumed_count,limit_count,tier")
        .eq("user_id", userId)
        .eq("usage_date", usageDate);

      if (feature) {
        usageQuery = usageQuery.eq("feature", feature);
      }

      const usageRes = await usageQuery;

      if (usageRes.error && usageRes.status !== 406) throw usageRes.error;

      const rows = (usageRes.data ?? []) as {
        consumed_count: number | null;
        limit_count: number | null;
        tier: string | null;
      }[];
      const used = rows.reduce((sum, row) => sum + (typeof row.consumed_count === "number" ? row.consumed_count : 0), 0);
      const rowLimit = rows.reduce((max, row) => {
        const value = typeof row.limit_count === "number" && row.limit_count > 0 ? row.limit_count : 0;
        return Math.max(max, value);
      }, tierResult.limit);
      const tier = rows.find((row) => row.tier === "pro" || row.tier === "elite" || row.tier === "free")?.tier ?? tierResult.tier;
      const resolvedTier = resolveTierLimit(tier).tier;
      const limit = Math.max(rowLimit, resolveTierLimit(tier).limit);

      return {
        feature: feature ?? "daily_goal",
        isLimitReached: used >= limit,
        limit,
        remaining: Math.max(limit - used, 0),
        tier: resolvedTier,
        usageDate,
        used,
      };
    },
    staleTime: 30_000,
  });

  return {
    error: (query.error as WolfAIError | null) ?? null,
    isLimitReached: query.data?.isLimitReached ?? false,
    isLoading: query.isLoading,
    limit: query.data?.limit ?? 0,
    queryKey,
    remaining: query.data?.remaining ?? 0,
    refetch: query.refetch,
    tier: query.data?.tier ?? "free",
    used: query.data?.used ?? 0,
  };
}
