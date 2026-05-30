import { router } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { View } from "react-native";

import { ModalSheet } from "@/src/components/layout";
import { AppButton, AppInput, Typography } from "@/src/components/primitives";
import { useUpdateMacroTargets } from "@/src/hooks/mutations";
import { useMacroTargets } from "@/src/hooks/queries";
import { colors } from "@/src/theme";

function toFieldValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(Math.round(value)) : "";
}

function parseTarget(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) {
    return `${label} is required.`;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return `${label} must be greater than 0.`;
  }

  return null;
}

function EditNutritionGoalsScreenComponent() {
  const macroTargetsQuery = useMacroTargets();
  const updateMacroTargetsMutation = useUpdateMacroTargets();

  const [caloriesTarget, setCaloriesTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");
  const [error, setError] = useState<string | null>(null);

  const existingTargets = macroTargetsQuery.data ?? null;

  useEffect(() => {
    setCaloriesTarget(toFieldValue(existingTargets?.daily_calorie_target));
    setProteinTarget(toFieldValue(existingTargets?.daily_protein_target));
    setCarbsTarget(toFieldValue(existingTargets?.daily_carbs_target));
    setFatTarget(toFieldValue(existingTargets?.daily_fat_target));
  }, [
    existingTargets?.daily_calorie_target,
    existingTargets?.daily_carbs_target,
    existingTargets?.daily_fat_target,
    existingTargets?.daily_protein_target,
  ]);

  useEffect(() => {
    if (macroTargetsQuery.error) {
      console.warn("[nutrition]", "Nutrition goals query failed.", {
        message:
          macroTargetsQuery.error instanceof Error
            ? macroTargetsQuery.error.message
            : String(macroTargetsQuery.error),
        screen: "EditNutritionGoals",
        type: "macro-targets",
      });
    }
  }, [macroTargetsQuery.error]);

  const fieldError = useMemo(() => {
    return (
      parseTarget(caloriesTarget, "Calories target") ||
      parseTarget(proteinTarget, "Protein target") ||
      parseTarget(carbsTarget, "Carbs target") ||
      parseTarget(fatTarget, "Fat target")
    );
  }, [caloriesTarget, proteinTarget, carbsTarget, fatTarget]);

  const handleSave = async () => {
    const nextError = fieldError;
    if (nextError) {
      setError(nextError);
      return;
    }

    setError(null);

    try {
      await updateMacroTargetsMutation.mutateAsync({
        caloriesTarget: Number(caloriesTarget.trim()),
        carbsTarget: Number(carbsTarget.trim()),
        fatTarget: Number(fatTarget.trim()),
        proteinTarget: Number(proteinTarget.trim()),
      });

      router.back();
    } catch (saveError) {
      console.warn("[nutrition]", "Failed to save nutrition goals.", {
        message: saveError instanceof Error ? saveError.message : String(saveError),
        screen: "EditNutritionGoals",
        type: "save-goals",
      });
      setError(saveError instanceof Error ? saveError.message : "Unable to save nutrition goals.");
    }
  };

  return (
    <ModalSheet eyebrow="Nutrition" title="Nutrition Goals">
      {macroTargetsQuery.error ? (
        <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load goals</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
          <AppButton onPress={() => macroTargetsQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </View>
      ) : null}

      <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Daily Macro Targets</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Set your baseline goals for calories and macros.
        </Typography>
      </View>

      <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <AppInput
          keyboardType="number-pad"
          label="Calories target"
          onChangeText={(text) => {
            setError(null);
            setCaloriesTarget(text);
          }}
          placeholder="2400"
          value={caloriesTarget}
        />
        <AppInput
          keyboardType="number-pad"
          label="Protein target (g)"
          onChangeText={(text) => {
            setError(null);
            setProteinTarget(text);
          }}
          placeholder="150"
          value={proteinTarget}
        />
        <AppInput
          keyboardType="number-pad"
          label="Carbs target (g)"
          onChangeText={(text) => {
            setError(null);
            setCarbsTarget(text);
          }}
          placeholder="250"
          value={carbsTarget}
        />
        <AppInput
          keyboardType="number-pad"
          label="Fat target (g)"
          onChangeText={(text) => {
            setError(null);
            setFatTarget(text);
          }}
          placeholder="70"
          value={fatTarget}
        />
      </View>

      <View className="rounded-2xl border border-border bg-surface-raised p-4">
        <Typography tone="secondary" variant="labelSm">
          These goals are used across dashboard summaries, nutrition tracking, and AI coaching guidance.
        </Typography>
      </View>

      {error ? <Typography tone="danger" variant="labelSm">{error}</Typography> : null}

      <View className="flex-row gap-3 pt-1">
        <View className="flex-1">
          <AppButton onPress={() => router.back()} variant="ghost">
            Cancel
          </AppButton>
        </View>
        <View className="flex-1">
          <AppButton
            className="bg-black border-black"
            isLoading={updateMacroTargetsMutation.isPending || macroTargetsQuery.isLoading}
            onPress={handleSave}
            style={{ backgroundColor: colors.black, borderColor: colors.black }}
            variant="primary"
          >
            Save
          </AppButton>
        </View>
      </View>
    </ModalSheet>
  );
}

export const EditNutritionGoalsScreen = memo(EditNutritionGoalsScreenComponent);
