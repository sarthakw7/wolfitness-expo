import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ModalSheet } from "@/src/components/layout/ModalSheet";
import { AppButton, AppInput, Typography } from "@/src/components/primitives";
import { useAddMealLog, useEstimateMeal } from "@/src/hooks/mutations";

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddMealModalRoute() {
  const params = useLocalSearchParams<{ prefillMealName?: string }>();
  const estimateMealMutation = useEstimateMeal();
  const addMealLogMutation = useAddMealLog();

  const [foodDescription, setFoodDescription] = useState("");
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const trimmedFoodDescription = foodDescription.trim();
  const preview = estimateMealMutation.data ?? null;
  const isEstimating = estimateMealMutation.isPending;
  const isSaving = addMealLogMutation.isPending;
  const canEstimate = trimmedFoodDescription.length > 0 && !isEstimating && !isSaving;
  const canConfirm = Boolean(preview) && !isEstimating && !isSaving;
  const prefillMealName =
    typeof params.prefillMealName === "string" ? params.prefillMealName.trim() : "";

  const confidenceLabel = useMemo(() => {
    if (typeof preview?.confidence !== "number") return null;
    return `${Math.round(preview.confidence)}% confidence`;
  }, [preview?.confidence]);

  useEffect(() => {
    if (!prefillMealName) {
      return;
    }

    setFoodDescription(prefillMealName);
    estimateMealMutation.reset();
    setEstimateError(null);
    setSaveError(null);

    console.info("[nutrition-ai]", "AI prefill applied in add-meal modal.", {
      prefillMealName,
      screen: "AddMealModal",
    });
  }, [estimateMealMutation, prefillMealName]);

  const handleEstimate = async () => {
    if (!trimmedFoodDescription || isEstimating || isSaving) return;

    setEstimateError(null);
    setSaveError(null);

    try {
      await estimateMealMutation.mutateAsync({ food: trimmedFoodDescription });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to estimate meal macros.";
      console.warn("[nutrition]", "Estimate request failed in add-meal modal.", {
        food: trimmedFoodDescription,
        message,
      });
      setEstimateError(message);
    }
  };

  const handleConfirm = async () => {
    if (!preview || isSaving || isEstimating) return;

    setSaveError(null);

    try {
      await addMealLogMutation.mutateAsync({
        calories: preview.calories,
        carbs: preview.carbs,
        fat: preview.fat,
        foodName: preview.food_name,
        loggedAt: toIsoDate(),
        mealCategory: "Smart Input",
        protein: preview.protein,
      });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save meal log.";
      console.warn("[nutrition]", "Meal save failed in add-meal modal.", {
        foodName: preview.food_name,
        message,
      });
      setSaveError(message);
    }
  };

  const handleResetPreview = () => {
    estimateMealMutation.reset();
    setEstimateError(null);
    setSaveError(null);
  };

  return (
    <ModalSheet eyebrow="Nutrition" title="Add Meal">
      <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Describe your meal</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Enter a free text meal description and estimate macros before saving.
        </Typography>
        <AppInput
          autoCapitalize="sentences"
          editable={!isEstimating && !isSaving}
          label="Meal Description"
          multiline
          onChangeText={(next) => {
            setFoodDescription(next);
            if (estimateError) setEstimateError(null);
            if (saveError) setSaveError(null);
            if (preview) {
              estimateMealMutation.reset();
            }
          }}
          placeholder="Oatmeal with whey and banana"
          style={{ minHeight: 72, textAlignVertical: "top" }}
          value={foodDescription}
        />
        {estimateError ? (
          <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
            <Typography variant="labelMd">Unable to estimate meal</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {estimateError}
            </Typography>
            <AppButton disabled={!canEstimate} isLoading={isEstimating} onPress={handleEstimate} variant="secondary">
              Retry
            </AppButton>
          </View>
        ) : null}
        {!preview ? (
          <AppButton disabled={!canEstimate} isLoading={isEstimating} onPress={handleEstimate} variant="secondary">
            {isEstimating ? "Estimating..." : "Estimate Meal"}
          </AppButton>
        ) : null}
      </View>

      {preview ? (
        <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-5">
          <View className="gap-1">
            <Typography variant="headlineLg">{preview.food_name}</Typography>
            {confidenceLabel ? (
              <Typography tone="secondary" variant="labelSm">
                {confidenceLabel}
              </Typography>
            ) : null}
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Typography tone="secondary" variant="labelSm">
                Calories
              </Typography>
              <Typography variant="bodyMd">{Math.round(preview.calories)} kcal</Typography>
            </View>
            <View className="flex-row items-center justify-between">
              <Typography tone="secondary" variant="labelSm">
                Protein
              </Typography>
              <Typography variant="bodyMd">{Math.round(preview.protein)} g</Typography>
            </View>
            <View className="flex-row items-center justify-between">
              <Typography tone="secondary" variant="labelSm">
                Carbs
              </Typography>
              <Typography variant="bodyMd">{Math.round(preview.carbs)} g</Typography>
            </View>
            <View className="flex-row items-center justify-between">
              <Typography tone="secondary" variant="labelSm">
                Fat
              </Typography>
              <Typography variant="bodyMd">{Math.round(preview.fat)} g</Typography>
            </View>
          </View>

          {saveError ? (
            <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
              <Typography variant="labelMd">Unable to save meal</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {saveError}
              </Typography>
              <AppButton disabled={!canConfirm} isLoading={isSaving} onPress={handleConfirm} variant="secondary">
                Retry
              </AppButton>
            </View>
          ) : null}

          <View className="gap-3">
            <AppButton disabled={!canConfirm} isLoading={isSaving} onPress={handleConfirm} variant="secondary">
              {isSaving ? "Saving..." : "Confirm"}
            </AppButton>
            <AppButton disabled={isSaving} onPress={handleResetPreview} variant="ghost">
              Estimate Again
            </AppButton>
          </View>
        </View>
      ) : null}
    </ModalSheet>
  );
}
