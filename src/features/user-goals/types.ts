import type { Ionicons } from "@expo/vector-icons";

export type GoalTypeValue =
  | "fat_loss"
  | "muscle_gain"
  | "strength"
  | "endurance"
  | "hybrid_athlete"
  | "general_health";

export type ActivityLevelValue = "sedentary" | "lightly_active" | "moderately_active" | "very_active";

export type SelectableOption<T extends string> = {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: T;
};

export type GoalProfileFormValues = {
  activityLevel: ActivityLevelValue | null;
  goalType: GoalTypeValue | null;
  heightCm: string;
  targetGoal: string;
  weightKg: string;
};
