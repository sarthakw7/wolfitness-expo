import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/hooks/useAuth";

import { WOLF_AI_QUERY_KEYS, WOLF_AI_TIER_LIMITS } from "../constants";
import type { WolfAIFeature, WolfAITier, WolfAIUsageState } from "../types";

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

export function useWolfAIUsage(feature: WolfAIFeature) {
  const { user } = useAuth();

  return useQuery<WolfAIUsageState>({
    enabled: Boolean(user?.id),
    queryKey: user?.id ? WOLF_AI_QUERY_KEYS.usage(user.id, feature) : ["wolf-ai", "usage", "anonymous", feature],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("Not authenticated.");
      }

      const entitlementRes = await supabase.from("ai_entitlements").select("tier,status,timezone").eq("user_id", user.id).maybeSingle();
      if (entitlementRes.error && entitlementRes.status !== 406) throw entitlementRes.error;

      const tierResult = resolveTierLimit(
        entitlementRes.data?.status === "active" || entitlementRes.data?.status === "trial" ? entitlementRes.data?.tier : "free",
      );
      const usageDate = getLocalIsoDate(entitlementRes.data?.timezone ?? null);

      const usageRes = await supabase
        .from("ai_usage_daily")
        .select("consumed_count,limit_count,tier")
        .eq("user_id", user.id)
        .eq("usage_date", usageDate)
        .eq("feature", feature)
        .maybeSingle();

      if (usageRes.error && usageRes.status !== 406) throw usageRes.error;

      const rowTier = resolveTierLimit(usageRes.data?.tier ?? tierResult.tier);
      const used = typeof usageRes.data?.consumed_count === "number" ? usageRes.data.consumed_count : 0;
      const limit = Math.max(
        typeof usageRes.data?.limit_count === "number" && usageRes.data.limit_count > 0
          ? usageRes.data.limit_count
          : rowTier.limit,
        rowTier.limit,
      );

      return {
        feature,
        isLimitReached: used >= limit,
        limit,
        remaining: Math.max(limit - used, 0),
        tier: rowTier.tier,
        usageDate,
        used,
      };
    },
    staleTime: 30_000,
  });
}
