import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatActivityLevelLabel,
  formatGoalTypeLabel,
  formatHeightCm,
  formatWeightKg,
  normalizeGoalType,
  GOAL_TYPE_OPTIONS,
} from "../constants";
import { parseOptionalPositiveNumber, validateOptionalPositiveNumber } from "../lib/goal-profile-validation";
import { getTargetGoalSuggestions } from "../lib/targetGoalSuggestions";
import type { ActivityLevelValue, GoalTypeValue } from "../types";

import type { FitnessProfile } from "@/src/services/profile.service";

export function useGoalProfileForm(fitnessProfile: FitnessProfile | null, isLoading: boolean) {
  const hydratedRef = useRef(false);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [goalType, setGoalType] = useState<GoalTypeValue | null>(null);
  const [targetGoal, setTargetGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevelValue | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (isLoading) return;

    setWeightKg(typeof fitnessProfile?.weight_kg === "number" ? String(fitnessProfile.weight_kg) : "");
    setHeightCm(typeof fitnessProfile?.height_cm === "number" ? String(fitnessProfile.height_cm) : "");
    setGoalType(normalizeGoalType(fitnessProfile?.goal_type ?? fitnessProfile?.primary_goal));
    setTargetGoal(fitnessProfile?.target_goal ?? "");
    setActivityLevel((fitnessProfile?.activity_level as ActivityLevelValue | null) ?? null);
    hydratedRef.current = true;
  }, [fitnessProfile?.activity_level, fitnessProfile?.goal_type, fitnessProfile?.height_cm, fitnessProfile?.primary_goal, fitnessProfile?.target_goal, fitnessProfile?.weight_kg, isLoading]);

  const weightError = useMemo(() => validateOptionalPositiveNumber(weightKg, "Weight"), [weightKg]);
  const heightError = useMemo(() => validateOptionalPositiveNumber(heightCm, "Height"), [heightCm]);
  const selectedGoalType = normalizeGoalType(goalType);
  const selectedGoalTypeLabel = formatGoalTypeLabel(selectedGoalType);
  const selectedActivityLevelLabel = formatActivityLevelLabel(activityLevel);
  const selectedGoalTypeDescription = GOAL_TYPE_OPTIONS.find((option) => option.value === selectedGoalType)?.description ?? null;
  const targetSuggestions = useMemo(() => getTargetGoalSuggestions(selectedGoalType), [selectedGoalType]);
  const canSave = Boolean(selectedGoalType) && Boolean(activityLevel) && !weightError && !heightError;

  return {
    activityLevel,
    canSave,
    heightCm,
    heightError,
    hydrated: hydratedRef.current,
    goalType,
    parseOptionalPositiveNumber,
    selectedActivityLevelLabel,
    selectedGoalType,
    selectedGoalTypeDescription,
    selectedGoalTypeLabel,
    setActivityLevel,
    setGoalType,
    setHeightCm,
    setTargetGoal,
    setWeightKg,
    targetGoal,
    targetSuggestions,
    weightError,
    weightKg,
    formatHeightCm,
    formatWeightKg,
  };
}
