import { useCallback } from "react";

import { normalizeCompletedSetPayload } from "@/src/features/workout/lib/normalizeCompletedSetPayload";
import {
  buildWorkoutLogKey,
  getWorkoutExerciseIdentityKey,
} from "@/src/features/workout/lib/workoutLogIdentity";
import { getTargetSets } from "@/src/features/workout/lib/workoutPrescription";
import type { WorkoutExercise } from "@/src/features/workout/services/workoutTypes";

type SetDraft = {
  lbs: string;
  reps: string;
  rpe: string;
};

type CompleteSetPayload = {
  exerciseLibraryId: string | null;
  exerciseName?: string | null;
  repsCompleted?: number | null;
  rpeActual?: number | null;
  sessionId: string;
  setNumber: number;
  sourceExerciseKey?: string | null;
  weightKg?: number | null;
};

type UseWorkoutSetActionsInput = {
  clearSetPending: (logKey: string) => void;
  completeSet: (payload: CompleteSetPayload) => Promise<unknown>;
  completeSetIsPending: boolean;
  completedSetNumbersByExercise: Map<string, Set<number>>;
  focusNextSetInput: (exerciseIdentityKey: string, setNumber: number) => void;
  isSignalExecution: boolean;
  markSetPending: (logKey: string) => void;
  pendingCompletedSetKeys: Set<string>;
  refetchSession: () => void;
  sessionComplete: boolean;
  sessionId: string | null | undefined;
  setDrafts: Record<string, SetDraft>;
  triggerSetCompletedHaptic: () => void;
};

export function useWorkoutSetActions({
  clearSetPending,
  completeSet,
  completeSetIsPending,
  completedSetNumbersByExercise,
  focusNextSetInput,
  isSignalExecution,
  markSetPending,
  pendingCompletedSetKeys,
  refetchSession,
  sessionComplete,
  sessionId,
  setDrafts,
  triggerSetCompletedHaptic,
}: UseWorkoutSetActionsInput) {
  const completeWorkoutSet = useCallback(
    async (exercise: WorkoutExercise, setNumber: number) => {
      if (!sessionId || completeSetIsPending || sessionComplete) return;
      const exerciseIdentityKey = getWorkoutExerciseIdentityKey(exercise);
      const completedSetNumbers = completedSetNumbersByExercise.get(exerciseIdentityKey) ?? new Set<number>();
      const targetSets = getTargetSets(exercise);
      const isExerciseComplete = targetSets > 0 && completedSetNumbers.size >= targetSets;
      const logKey = buildWorkoutLogKey(exerciseIdentityKey, setNumber);
      if (isExerciseComplete || completedSetNumbers.has(setNumber) || pendingCompletedSetKeys.has(logKey)) {
        return;
      }
      const draft = setDrafts[logKey] ?? { lbs: "", reps: "", rpe: "" };
      const totalSets = targetSets;
      const willCompleteExercise = totalSets > 0 && setNumber >= totalSets;
      const normalized = normalizeCompletedSetPayload({ draft, exercise, isSignalWorkout: isSignalExecution, setNumber });
      const payload = {
        exerciseLibraryId: normalized.exerciseLibraryId,
        exerciseName: normalized.exerciseName,
        repsCompleted: normalized.repsCompleted,
        rpeActual: normalized.rpeActual,
        sessionId,
        setNumber: normalized.setNumber,
        sourceExerciseKey: normalized.sourceExerciseKey,
        weightKg: normalized.weightKg,
      };

      try {
        markSetPending(logKey);
        await completeSet(payload);
        triggerSetCompletedHaptic();

        if (!willCompleteExercise) {
          setTimeout(() => {
            focusNextSetInput(exerciseIdentityKey, setNumber + 1);
          }, 150);
        }
      } catch (error) {
        clearSetPending(logKey);
        console.warn("[athlete-flow]", {
          error: error instanceof Error ? error.message : String(error),
          screen: "WorkoutPlayer",
          type: "complete-set-action",
        });
        refetchSession();
      }
    },
    [
      clearSetPending,
      completeSet,
      completeSetIsPending,
      completedSetNumbersByExercise,
      focusNextSetInput,
      isSignalExecution,
      markSetPending,
      pendingCompletedSetKeys,
      refetchSession,
      sessionComplete,
      sessionId,
      setDrafts,
      triggerSetCompletedHaptic,
    ],
  );

  return {
    completeSet: completeWorkoutSet,
    isCompletingSet: completeSetIsPending,
  };
}
