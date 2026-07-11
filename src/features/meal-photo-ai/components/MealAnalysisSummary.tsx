import { memo } from "react";
import { ActivityIndicator, View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

import { WolfAIStatusBadge } from "@/src/features/wolf-ai/components/WolfAIStatusBadge";

import { MEAL_PHOTO_AI_ERROR_MESSAGES, MEAL_PHOTO_AI_INFO_TEXT } from "../constants";
import { MealAnalysisItem } from "./MealAnalysisItem";
import type { MealPhotoAIError, MealPhotoAnalysis } from "../types";

type MealAnalysisSummaryProps = {
  cached?: boolean;
  hasSelectedImage?: boolean;
  error?: MealPhotoAIError | null;
  isAnalyzing?: boolean;
  onReviewEdit?: () => void;
  onRetry?: () => void;
  result: MealPhotoAnalysis | null;
  safetyCategory?: string | null;
  usedFallback?: boolean;
};

function confidenceTone(confidence: MealPhotoAnalysis["confidence"]): "accent" | "neutral" | "warning" {
  if (confidence === "high") return "accent";
  if (confidence === "medium") return "warning";
  return "neutral";
}

function confidenceLabel(confidence: MealPhotoAnalysis["confidence"]) {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    default:
      return "Low confidence";
  }
}

function MealAnalysisSummaryComponent({
  cached = false,
  hasSelectedImage = false,
  error = null,
  isAnalyzing = false,
  onReviewEdit,
  onRetry,
  result,
  safetyCategory,
  usedFallback = false,
}: MealAnalysisSummaryProps) {
  if (!result && error) {
    return (
      <EditorialCard className="gap-4">
        <View className="gap-1">
          <Typography tone="secondary" variant="labelSm">
            WOLF AI
          </Typography>
          <Typography variant="headlineLg">Meal analysis unavailable</Typography>
        </View>
        <Typography tone="secondary" variant="bodyMd">
          {error.message}
        </Typography>
        {onRetry ? (
          <AppButton disabled={isAnalyzing} isLoading={isAnalyzing} onPress={onRetry} variant="secondary">
            Retry
          </AppButton>
        ) : null}
      </EditorialCard>
    );
  }

  if (!result) {
    if (isAnalyzing) {
      return (
        <EditorialCard className="gap-4">
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color="#0F7A4A" />
            <View className="gap-1">
              <Typography tone="secondary" variant="labelSm">
                WOLF AI
              </Typography>
              <Typography variant="headlineLg">Analyzing your meal...</Typography>
            </View>
          </View>
          <Typography tone="secondary" variant="bodyMd">
            This can take a few seconds. Keep the photo visible while Wolf AI estimates foods, calories, and macros.
          </Typography>
        </EditorialCard>
      );
    }

    return (
      <EditorialCard className="gap-3">
        <Typography variant="headlineLg">Ready to analyze</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Review the photo, then tap Analyze Meal to estimate foods, calories, and macros.
        </Typography>
        {hasSelectedImage ? (
          <Typography tone="secondary" variant="labelSm">
            {MEAL_PHOTO_AI_INFO_TEXT}
          </Typography>
        ) : null}
      </EditorialCard>
    );
  }

  const visibleItems = result.items.slice(0, 12);
  const warnings = result.warnings.slice(0, 4);
  const assumptions = result.assumptions.slice(0, 4);

  return (
    <EditorialCard className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography tone="secondary" variant="labelSm">
            WOLF AI
          </Typography>
          <Typography variant="headlineLg">{result.mealName}</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {MEAL_PHOTO_AI_INFO_TEXT}
          </Typography>
        </View>
        <View className="items-end gap-2">
          <WolfAIStatusBadge label={confidenceLabel(result.confidence)} tone={confidenceTone(result.confidence)} />
          {cached ? <WolfAIStatusBadge label="Cached" tone="neutral" /> : null}
          {usedFallback ? <WolfAIStatusBadge label="Fallback" tone="warning" /> : null}
        </View>
      </View>

      {error?.code === "LIMIT_REACHED" ? (
        <EditorialCard tone="muted" className="gap-2 border border-border p-4">
          <Typography variant="labelMd">Limit reached</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {MEAL_PHOTO_AI_ERROR_MESSAGES.limitReached}
          </Typography>
        </EditorialCard>
      ) : null}

      {error && error.code === "UNAUTHORIZED" ? (
        <EditorialCard tone="muted" className="gap-2 border border-border p-4">
          <Typography variant="labelMd">Sign in needed</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {MEAL_PHOTO_AI_ERROR_MESSAGES.unauthorized}
          </Typography>
        </EditorialCard>
      ) : null}

      {error && error.code === "NETWORK_ERROR" ? (
        <EditorialCard tone="muted" className="gap-2 border border-border p-4">
          <Typography variant="labelMd">Refresh unavailable</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {MEAL_PHOTO_AI_ERROR_MESSAGES.network}
          </Typography>
        </EditorialCard>
      ) : null}

      {safetyCategory && safetyCategory !== "allowed" ? (
        <EditorialCard tone="muted" className="gap-2 border border-border p-4">
          <Typography variant="labelMd">Review carefully</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This image needs a manual review before saving.
          </Typography>
        </EditorialCard>
      ) : null}

      <View className="gap-3 rounded-2xl border border-border bg-surface-muted p-4">
        <View className="flex-row flex-wrap gap-2">
          <Typography tone="secondary" variant="labelSm">
            Calories {Math.round(result.totals.calories)}
          </Typography>
          <Typography tone="secondary" variant="labelSm">
            Protein {Math.round(result.totals.protein)}g
          </Typography>
          <Typography tone="secondary" variant="labelSm">
            Carbs {Math.round(result.totals.carbs)}g
          </Typography>
          <Typography tone="secondary" variant="labelSm">
            Fat {Math.round(result.totals.fat)}g
          </Typography>
        </View>
      </View>

      <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-4">
        <Typography variant="labelMd">Detected foods</Typography>
        <View className="gap-3">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => <MealAnalysisItem item={item} key={item.id} />)
          ) : (
            <Typography tone="secondary" variant="bodyMd">
              No food items were detected. Please review the image manually.
            </Typography>
          )}
        </View>
      </View>

      <View className="gap-3">
        {assumptions.length > 0 ? (
          <View className="gap-1">
            <Typography variant="labelMd">Assumptions</Typography>
            {assumptions.map((assumption, index) => (
              <Typography key={`assumption-${index}`} tone="secondary" variant="bodyMd">
                • {assumption}
              </Typography>
            ))}
          </View>
        ) : null}

        {warnings.length > 0 ? (
          <View className="gap-1">
            <Typography variant="labelMd">Warnings</Typography>
            {warnings.map((warning, index) => (
              <Typography key={`warning-${index}`} tone="secondary" variant="bodyMd">
                • {warning}
              </Typography>
            ))}
          </View>
        ) : null}
      </View>

      {onReviewEdit ? (
        <AppButton onPress={onReviewEdit} variant="secondary">
          Review &amp; Edit
        </AppButton>
      ) : (
        <AppButton disabled size="sm" variant="ghost">
          Review &amp; Edit coming next
        </AppButton>
      )}
    </EditorialCard>
  );
}

export const MealAnalysisSummary = memo(MealAnalysisSummaryComponent);
