import type { GoalTypeValue, SelectableOption, ActivityLevelValue } from "./types";

export type { ActivityLevelValue, GoalTypeValue, SelectableOption } from "./types";

export const GOAL_TYPE_OPTIONS: SelectableOption<GoalTypeValue>[] = [
  {
    value: "fat_loss",
    label: "Fat Loss",
    description: "Reduce body fat while protecting muscle and training quality.",
    icon: "flame-outline",
  },
  {
    value: "muscle_gain",
    label: "Muscle Gain",
    description: "Build size and lean mass with progressive overload.",
    icon: "barbell-outline",
  },
  {
    value: "strength",
    label: "Strength",
    description: "Push absolute force, bar speed, and neural efficiency.",
    icon: "fitness-outline",
  },
  {
    value: "endurance",
    label: "Endurance",
    description: "Improve work capacity and sustained output.",
    icon: "walk-outline",
  },
  {
    value: "hybrid_athlete",
    label: "Hybrid Athlete",
    description: "Balance strength, conditioning, and performance.",
    icon: "swap-horizontal-outline",
  },
  {
    value: "general_health",
    label: "General Health",
    description: "Stay active, capable, and healthy for the long term.",
    icon: "heart-outline",
  },
];

export const ACTIVITY_LEVEL_OPTIONS: SelectableOption<ActivityLevelValue>[] = [
  {
    value: "sedentary",
    label: "Sedentary",
    description: "Mostly seated with minimal daily movement.",
    icon: "bed-outline",
  },
  {
    value: "lightly_active",
    label: "Lightly Active",
    description: "Some walking and a few light sessions each week.",
    icon: "walk-outline",
  },
  {
    value: "moderately_active",
    label: "Moderately Active",
    description: "Regular training or active work most days.",
    icon: "bicycle-outline",
  },
  {
    value: "very_active",
    label: "Very Active",
    description: "Frequent training and high daily movement.",
    icon: "flash-outline",
  },
];

const GOAL_TYPE_LABELS: Record<GoalTypeValue, string> = {
  fat_loss: "Fat Loss",
  general_health: "General Health",
  hybrid_athlete: "Hybrid Athlete",
  muscle_gain: "Muscle Gain",
  endurance: "Endurance",
  strength: "Strength",
};

const ACTIVITY_LEVEL_LABELS: Record<ActivityLevelValue, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
};

const LEGACY_GOAL_TYPE_MAP: Record<string, GoalTypeValue> = {
  build_muscle: "muscle_gain",
  gain_muscle: "muscle_gain",
  improve_mobility: "general_health",
  increase_endurance: "endurance",
  lose_fat: "fat_loss",
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

export function normalizeGoalType(value: string | null | undefined): GoalTypeValue | null {
  if (!value) return null;
  const slug = normalizeSlug(value);
  if (slug in GOAL_TYPE_LABELS) {
    return slug as GoalTypeValue;
  }
  return LEGACY_GOAL_TYPE_MAP[slug] ?? null;
}

export function formatGoalTypeLabel(value: string | null | undefined): string | null {
  const normalized = normalizeGoalType(value);
  if (normalized) return GOAL_TYPE_LABELS[normalized];
  if (!value) return null;
  return titleCase(value);
}

export function formatActivityLevelLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = normalizeSlug(value);
  if (slug in ACTIVITY_LEVEL_LABELS) {
    return ACTIVITY_LEVEL_LABELS[slug as ActivityLevelValue];
  }
  return titleCase(value);
}

export function formatHeightCm(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "--";
  return `${Math.round(value)} cm`;
}

export function formatWeightKg(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "--";
  return `${Math.round(value * 10) / 10} kg`;
}
