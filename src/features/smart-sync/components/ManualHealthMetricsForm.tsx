import { memo } from "react";
import { View } from "react-native";

import { AppInput, Typography } from "@/src/components/primitives";

import type { HealthMetricFormErrors, HealthMetricFormValues, HealthMetricFieldKey } from "../types";

type ManualHealthMetricsFormProps = {
  errors: HealthMetricFormErrors;
  onChange: (field: HealthMetricFieldKey, value: string) => void;
  title?: string;
  values: HealthMetricFormValues;
};

function ManualHealthMetricsFormComponent({ errors, onChange, title, values }: ManualHealthMetricsFormProps) {
  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">{title ?? "Today's Manual Health Metrics"}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Manual entry is the launch-ready workflow. Save today&apos;s metrics now, even before device sync integrations are available.
        </Typography>
      </View>

      <View className="rounded-2xl border border-border bg-surface-raised p-5">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <AppInput
              keyboardType="number-pad"
              label="Steps"
              onChangeText={(text) => onChange("steps", text)}
              placeholder="8240"
              value={values.steps}
              error={errors.steps ?? undefined}
            />
          </View>
          <View className="flex-1">
            <AppInput
              keyboardType="decimal-pad"
              label="Sleep hours"
              onChangeText={(text) => onChange("sleepHours", text)}
              placeholder="7.5"
              value={values.sleepHours}
              error={errors.sleepHours ?? undefined}
            />
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <AppInput
              keyboardType="number-pad"
              label="Resting heart rate"
              onChangeText={(text) => onChange("restingHeartRate", text)}
              placeholder="62"
              value={values.restingHeartRate}
              error={errors.restingHeartRate ?? undefined}
            />
          </View>
          <View className="flex-1">
            <AppInput
              keyboardType="number-pad"
              label="Calories burned"
              onChangeText={(text) => onChange("caloriesBurned", text)}
              placeholder="450"
              value={values.caloriesBurned}
              error={errors.caloriesBurned ?? undefined}
            />
          </View>
        </View>

        <View className="mt-4">
          <AppInput
            keyboardType="decimal-pad"
            label="Body weight (kg)"
            onChangeText={(text) => onChange("bodyWeightKg", text)}
            placeholder="82.5"
            value={values.bodyWeightKg}
            error={errors.bodyWeightKg ?? undefined}
          />
        </View>

        <View className="mt-4">
          <AppInput
            label="Notes"
            multiline
            numberOfLines={4}
            onChangeText={(text) => onChange("notes", text)}
            placeholder="Energy, recovery, soreness, sleep quality..."
            textAlignVertical="top"
            value={values.notes}
          />
        </View>
      </View>
    </View>
  );
}

export const ManualHealthMetricsForm = memo(ManualHealthMetricsFormComponent);
