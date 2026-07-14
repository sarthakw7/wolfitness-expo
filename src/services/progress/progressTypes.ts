import type { WorkoutSummary } from "@/src/features/workout-summary/types";

export type ProgressRange = "7d" | "30d";

export type SignalProgramLifecycleProgressRow = {
  completed_at: string | null;
  current_day_key: string | null;
  current_week_key: string | null;
  id: string;
  replaced_at: string | null;
  source: "legacy" | "signal";
  source_program_id: string;
  source_program_version: string | null;
  started_at: string;
  status: "active" | "paused" | "completed" | "replaced";
  updated_at: string;
  user_id: string;
};

export type SignalCompletedWorkoutSessionRow = {
  completed_at: string | null;
  active_program_id: string | null;
  id: string;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_program_version: string | null;
  source_week_key: string | null;
};

export type SignalProgramProgressSnapshot = {
  completedSessions: SignalCompletedWorkoutSessionRow[];
  lifecycle: SignalProgramLifecycleProgressRow | null;
};

export type WorkoutHistoryRow = {
  completedAt: string;
  dayId: string | null;
  dayLabel: string;
  exerciseCount: number;
  id: string;
  programId: string | null;
  programLabel: string;
  summary: WorkoutSummary;
  setCount: number;
  source: "legacy" | "signal" | null;
  sourceDayKey: string | null;
  sourceProgramId: string | null;
  sourceWeekKey: string | null;
  startedAt: string;
  subtitle: string;
  title: string;
};

export type WorkoutSessionDetailSetRow = {
  id: string;
  loggedAt: string;
  repsCompleted: number | null;
  rpeActual: number | null;
  setNumber: number;
  weightKg: number | null;
};

export type WorkoutSessionDetailExerciseGroup = {
  exerciseId: string;
  exerciseLabel: string;
  sets: WorkoutSessionDetailSetRow[];
};

export type WorkoutSessionDetail = {
  completedAt: string | null;
  dayLabel: string;
  durationMinutes: number | null;
  exerciseCount: number;
  groupedExercises: WorkoutSessionDetailExerciseGroup[];
  id: string;
  programLabel: string;
  summary: WorkoutSummary;
  setCount: number;
  source: "legacy" | "signal" | null;
  sourceDayKey: string | null;
  sourceProgramId: string | null;
  sourceWeekKey: string | null;
  startedAt: string;
  title: string;
};

export type ProgressTrendPoint = {
  date: string;
  percentOfTarget: number;
  target: number | null;
  value: number;
};

export type RecentProgressSession = {
  completedAt: string;
  dayId: string | null;
  durationMinutes: number | null;
  id: string;
  programId: string | null;
  startedAt: string;
  volume: number;
};

export type ProgressOverview = {
  calorieTrend: ProgressTrendPoint[];
  consistencyPercent: number;
  currentStreak: number;
  nutritionAdherence: {
    calorieAveragePercent: number;
    daysWithNutrition: number;
    proteinAveragePercent: number;
  };
  proteinTrend: ProgressTrendPoint[];
  range: ProgressRange;
  recentSessions: RecentProgressSession[];
  weeklyVolume: number;
  weeklyWorkoutCount: number;
};
