export type WorkoutSummarySessionLike = {
  completed_at: string | null | undefined;
  notes?: string | null | undefined;
  started_at: string;
};

export type WorkoutSummarySetLike = {
  exercise_library_id?: string | null | undefined;
  exercise_name?: string | null | undefined;
  id: string;
  reps_completed?: number | null | undefined;
  rpe_actual?: number | null | undefined;
  source_exercise_key?: string | null | undefined;
  weight_kg?: number | null | undefined;
};

export type WorkoutSummary = {
  averageRpe: number | null;
  completedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  startedAt: string;
  totalExercises: number;
  totalReps: number;
  totalSets: number;
  totalVolumeKg: number;
  totalWeightMovedKg: number;
};
