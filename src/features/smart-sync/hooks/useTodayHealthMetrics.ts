import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";

import { getTodayHealthMetricLog, upsertTodayHealthMetricLog } from "../services/healthMetrics.service";
import {
  getLocalDateKey,
  parseOptionalNumber,
  parseOptionalPositiveInteger,
  validateOptionalPositiveInteger,
  validateOptionalPositiveNumber,
  validateOptionalSleepHours,
  formatMetricPreview,
} from "../lib/health-metrics";
import type { HealthMetricFieldKey, HealthMetricFormErrors, HealthMetricFormValues } from "../types";

const EMPTY_VALUES: HealthMetricFormValues = {
  bodyWeightKg: "",
  caloriesBurned: "",
  notes: "",
  restingHeartRate: "",
  sleepHours: "",
  steps: "",
};

export function useTodayHealthMetrics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const logDate = useMemo(() => getLocalDateKey(), []);
  const hydratedRef = useRef(false);
  const [values, setValues] = useState<HealthMetricFormValues>(EMPTY_VALUES);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const metricsQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.healthMetricLog(userId, logDate) : (["health-metric-log", "anonymous", logDate] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return getTodayHealthMetricLog(userId);
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (hydratedRef.current) return;
    if (metricsQuery.isLoading) return;

    const data = metricsQuery.data ?? null;
    setValues(
      data
        ? {
            bodyWeightKg: typeof data.bodyWeightKg === "number" ? String(data.bodyWeightKg) : "",
            caloriesBurned: typeof data.caloriesBurned === "number" ? String(data.caloriesBurned) : "",
            notes: data.notes ?? "",
            restingHeartRate: typeof data.restingHeartRate === "number" ? String(data.restingHeartRate) : "",
            sleepHours: typeof data.sleepHours === "number" ? String(data.sleepHours) : "",
            steps: typeof data.steps === "number" ? String(data.steps) : "",
          }
        : EMPTY_VALUES,
    );
    hydratedRef.current = true;
  }, [metricsQuery.data, metricsQuery.isLoading]);

  const errors: HealthMetricFormErrors = useMemo(
    () => ({
      bodyWeightKg: validateOptionalPositiveNumber(values.bodyWeightKg, "Body weight") ?? undefined,
      caloriesBurned: validateOptionalPositiveInteger(values.caloriesBurned, "Calories burned") ?? undefined,
      restingHeartRate: validateOptionalPositiveInteger(values.restingHeartRate, "Resting heart rate") ?? undefined,
      sleepHours: validateOptionalSleepHours(values.sleepHours) ?? undefined,
      steps: validateOptionalPositiveInteger(values.steps, "Steps") ?? undefined,
    }),
    [values.bodyWeightKg, values.caloriesBurned, values.restingHeartRate, values.sleepHours, values.steps],
  );

  const summaryText = useMemo(() => formatMetricPreview(metricsQuery.data ?? null), [metricsQuery.data]);
  const hasAnyValue = useMemo(
    () => Object.values(values).some((value) => value.trim().length > 0),
    [values],
  );
  const canSave = !metricsQuery.isLoading && !isSaving && !Object.values(errors).some(Boolean);

  const setField = (field: HealthMetricFieldKey, value: string) => {
    setSaveError(null);
    setValues((current) => ({ ...current, [field]: value }));
  };

  const saveTodayHealthMetrics = async () => {
    if (!userId) throw new Error("Not authenticated.");
    if (Object.values(errors).some(Boolean)) {
      throw new Error("Please fix the highlighted health metrics fields.");
    }

    const payload = {
      bodyWeightKg: parseOptionalNumber(values.bodyWeightKg),
      caloriesBurned: parseOptionalPositiveInteger(values.caloriesBurned),
      notes: values.notes.trim() || null,
      restingHeartRate: parseOptionalPositiveInteger(values.restingHeartRate),
      sleepHours: parseOptionalNumber(values.sleepHours),
      steps: parseOptionalPositiveInteger(values.steps),
    };

    if (!metricsQuery.data && !hasAnyValue) {
      return { skipped: true as const };
    }

    setIsSaving(true);

    try {
      await upsertTodayHealthMetricLog(userId, payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.healthMetricLog(userId, logDate) });
      return { skipped: false as const };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    canSave,
    errors,
    hasAnyValue,
    hydrated: hydratedRef.current,
    isLoading: metricsQuery.isLoading,
    isSaving,
    logDate,
    saveError,
    saveTodayHealthMetrics,
    setField,
    setSaveError,
    summaryText,
    todayMetrics: metricsQuery.data ?? null,
    values,
  };
}
