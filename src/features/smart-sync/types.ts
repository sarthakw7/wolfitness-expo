import type { Ionicons } from "@expo/vector-icons";

export type SmartSyncProviderValue =
  | "manual"
  | "apple_watch"
  | "samsung_health"
  | "health_connect"
  | "fitbit"
  | "whoop"
  | "withings";

export type SmartSyncStatusValue = "manual" | "coming_soon" | "connected";

export type SmartSyncProviderOption = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: SmartSyncProviderValue;
};

export type HealthMetricFieldKey =
  | "bodyWeightKg"
  | "caloriesBurned"
  | "notes"
  | "restingHeartRate"
  | "sleepHours"
  | "steps";

export type HealthMetricFormValues = Record<HealthMetricFieldKey, string>;

export type HealthMetricFormErrors = Partial<Record<HealthMetricFieldKey, string>>;

export type HealthMetricSummaryFields = {
  bodyWeightKg: number | null;
  caloriesBurned: number | null;
  notes: string | null;
  restingHeartRate: number | null;
  sleepHours: number | null;
  steps: number | null;
};
