import { supabase } from "@/src/lib/supabase";

import type { WorkoutLogSet } from "./workoutTypes";

const workoutLogSetSelect =
  "id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at";

export async function fetchWorkoutLogSets(sessionId: string): Promise<WorkoutLogSet[]> {
  const { data, error } = await supabase
    .from("workout_log_sets")
    .select(workoutLogSetSelect)
    .eq("session_id", sessionId)
    .order("set_number", { ascending: true })
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data as WorkoutLogSet[]) ?? [];
}

export async function completeSet(input: {
  exerciseLibraryId: string | null;
  exerciseName?: string | null;
  repsCompleted?: number | null;
  rpeActual?: number | null;
  sessionId: string;
  setNumber: number;
  sourceExerciseKey?: string | null;
  weightKg?: number | null;
}): Promise<WorkoutLogSet> {
  const useSignalIdentity = Boolean(input.sourceExerciseKey?.trim());
  const identityColumn = useSignalIdentity ? "source_exercise_key" : "exercise_library_id";
  const identityValue = useSignalIdentity ? input.sourceExerciseKey?.trim() ?? null : input.exerciseLibraryId;
  if (!identityValue) {
    throw new Error("Workout set identity is missing.");
  }
  const payload = {
    exercise_library_id: useSignalIdentity ? null : input.exerciseLibraryId,
    exercise_name: useSignalIdentity ? input.exerciseName ?? null : null,
    reps_completed: input.repsCompleted ?? null,
    rpe_actual: input.rpeActual ?? null,
    session_id: input.sessionId,
    set_number: input.setNumber,
    source_exercise_key: useSignalIdentity ? input.sourceExerciseKey?.trim() ?? null : null,
    weight_kg: input.weightKg ?? null,
  };

  if (__DEV__) {
    console.log("[workoutService.completeSet] payload", payload);
  }

  const existingRes = await supabase
    .from("workout_log_sets")
    .select(workoutLogSetSelect)
    .eq("session_id", input.sessionId)
    .eq(identityColumn, identityValue)
    .eq("set_number", input.setNumber)
    .maybeSingle();

  if (existingRes.error && existingRes.status !== 406) {
    console.log("[workoutService.completeSet] error", {
      code: existingRes.error.code ?? null,
      details: existingRes.error.details ?? null,
      hint: existingRes.error.hint ?? null,
      message: existingRes.error.message ?? null,
    });
    throw existingRes.error;
  }

  if (existingRes.data) {
    const updateRes = await supabase
      .from("workout_log_sets")
      .update(payload)
      .eq("id", existingRes.data.id)
      .select(workoutLogSetSelect)
      .single();

    if (updateRes.error) {
      console.log("[workoutService.completeSet] error", {
        code: updateRes.error.code ?? null,
        details: updateRes.error.details ?? null,
        hint: updateRes.error.hint ?? null,
        message: updateRes.error.message ?? null,
      });
      throw updateRes.error;
    }

    return updateRes.data as WorkoutLogSet;
  }

  const insertRes = await supabase
    .from("workout_log_sets")
    .insert(payload)
    .select(workoutLogSetSelect)
    .single();

  if (insertRes.error) {
    console.log("[workoutService.completeSet] error", {
      code: insertRes.error.code ?? null,
      details: insertRes.error.details ?? null,
      hint: insertRes.error.hint ?? null,
      message: insertRes.error.message ?? null,
    });
    throw insertRes.error;
  }
  return insertRes.data as WorkoutLogSet;
}
