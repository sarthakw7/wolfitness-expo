import type { WorkoutExercise } from "@/src/services/workout.service";

import { getSignalFallbackReps } from "./workoutPrescription";
import { lbsToKg } from "./weightConversion";
import { getWorkoutExerciseIdentityKey } from "./workoutLogIdentity";

export function normalizeCompletedSetPayload(input: {
  draft: { lbs: string; reps: string; rpe: string };
  exercise: WorkoutExercise;
  isSignalWorkout: boolean;
  setNumber: number;
}) {
  const repsCompletedRaw = input.draft.reps.trim() ? Number(input.draft.reps) : getSignalFallbackReps(input.exercise);
  const rpeActualRaw = input.draft.rpe.trim() ? Number(input.draft.rpe) : null;
  const weightLbsRaw = input.draft.lbs.trim() ? Number(input.draft.lbs) : NaN;
  const repsCompleted = Number.isFinite(repsCompletedRaw as number) ? (repsCompletedRaw as number) : null;
  const rpeActualValue = Number.isFinite(rpeActualRaw as number) ? (rpeActualRaw as number) : null;
  const rpeActual =
    rpeActualValue != null && rpeActualValue >= 1 && rpeActualValue <= 10 ? rpeActualValue : null;
  const weightKg = Number.isFinite(weightLbsRaw) ? lbsToKg(weightLbsRaw) : null;
  const exerciseIdentityKey = getWorkoutExerciseIdentityKey(input.exercise);

  return {
    exerciseLibraryId: input.isSignalWorkout ? null : exerciseIdentityKey,
    exerciseName: input.isSignalWorkout ? input.exercise.exercise.name : null,
    repsCompleted,
    rpeActual,
    setNumber: input.setNumber,
    sourceExerciseKey: input.isSignalWorkout ? exerciseIdentityKey : null,
    weightKg,
  };
}
