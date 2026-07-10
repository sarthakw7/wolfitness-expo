import { memo } from "react";
import { View } from "react-native";

import { SectionTitle } from "@/src/components/layout";
import { useProfile } from "@/src/hooks/queries";
import { useTodayHealthMetrics } from "@/src/features/smart-sync/hooks/useTodayHealthMetrics";

import { AIUsageCard } from "./AIUsageCard";
import { DailyGoalInsightCard } from "./DailyGoalInsightCard";
import { NutritionSuggestionCard } from "./NutritionSuggestionCard";
import { RecoverySuggestionCard } from "./RecoverySuggestionCard";
import { useDailyGoalInsight } from "../hooks/useDailyGoalInsight";
import { useNutritionSuggestions } from "../hooks/useNutritionSuggestions";
import { useRecoverySuggestions } from "../hooks/useRecoverySuggestions";
import { useWolfAIUsage } from "../hooks/useWolfAIUsage";

function WolfAIDashboardSectionComponent() {
  const profileQuery = useProfile();
  const todayHealthMetrics = useTodayHealthMetrics();
  const dailyGoalInsight = useDailyGoalInsight();
  const recoverySuggestions = useRecoverySuggestions();
  const nutritionSuggestions = useNutritionSuggestions();
  const usageQuery = useWolfAIUsage();

  const hasCompleteGoalProfile = Boolean(
    profileQuery.data?.fitnessProfile?.goal_type &&
      profileQuery.data?.fitnessProfile?.activity_level &&
      profileQuery.data?.fitnessProfile?.height_cm &&
      profileQuery.data?.fitnessProfile?.weight_kg,
  );
  const hasIncompleteContext = !hasCompleteGoalProfile || !todayHealthMetrics.todayMetrics;

  return (
    <View className="gap-2">
      <SectionTitle
        subtitle="Daily guidance powered by your goal profile, health metrics, and recent training."
        title="Wolf AI Guidance"
      />

      <DailyGoalInsightCard
        cached={dailyGoalInsight.cached}
        data={dailyGoalInsight.data}
        error={dailyGoalInsight.error}
        hasIncompleteGoalProfile={!hasCompleteGoalProfile}
        isLoading={dailyGoalInsight.isLoading}
        isLimitReached={dailyGoalInsight.isLimitReached}
        isRefreshing={dailyGoalInsight.isRefreshing}
        onRefresh={dailyGoalInsight.refresh}
        safetyCategory={dailyGoalInsight.safetyCategory}
        usedFallback={dailyGoalInsight.usedFallback}
      />

      <AIUsageCard
        error={usageQuery.error}
        isLoading={usageQuery.isLoading}
        isLimitReached={usageQuery.isLimitReached}
        limit={usageQuery.limit}
        onRetry={() => void usageQuery.refetch()}
        remaining={usageQuery.remaining}
        tier={usageQuery.tier}
        used={usageQuery.used}
      />

      <RecoverySuggestionCard
        cached={recoverySuggestions.cached}
        data={recoverySuggestions.data}
        error={recoverySuggestions.error}
        hasIncompleteContext={hasIncompleteContext}
        isLoading={recoverySuggestions.isLoading}
        isLimitReached={recoverySuggestions.isLimitReached}
        isRefreshing={recoverySuggestions.isRefreshing}
        onRefresh={recoverySuggestions.refresh}
        safetyCategory={recoverySuggestions.safetyCategory}
        usedFallback={recoverySuggestions.usedFallback}
      />

      <NutritionSuggestionCard
        cached={nutritionSuggestions.cached}
        data={nutritionSuggestions.data}
        error={nutritionSuggestions.error}
        hasIncompleteContext={hasIncompleteContext}
        isLoading={nutritionSuggestions.isLoading}
        isLimitReached={nutritionSuggestions.isLimitReached}
        isRefreshing={nutritionSuggestions.isRefreshing}
        onRefresh={nutritionSuggestions.refresh}
        safetyCategory={nutritionSuggestions.safetyCategory}
        usedFallback={nutritionSuggestions.usedFallback}
      />
    </View>
  );
}

export const WolfAIDashboardSection = memo(WolfAIDashboardSectionComponent);
