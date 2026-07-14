import { useState } from "react";
import { Alert } from "react-native";
import type { QueryClient } from "@tanstack/react-query";

import { normalizeCompletedSetPayload } from "@/src/features/workout/lib/normalizeCompletedSetPayload";
import {
  buildWorkoutLogKey,
  getWorkoutExerciseIdentityKey,
} from "@/src/features/workout/lib/workoutLogIdentity";
import { getTargetSets } from "@/src/features/workout/lib/workoutPrescription";
import type {
  SignalWorkoutSessionScope,
  WorkoutPlanForToday,
} from "@/src/features/workout/services/workoutTypes";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { workoutService } from "@/src/services";

type SetDraft = {
  lbs: string;
  reps: string;
  rpe: string;
};

type UseSignalSaveAndExitInput = {
  completedSetNumbersByExercise: Map<string, Set<number>>;
  completeSetMutationIsPending: boolean;
  drafts: Record<string, SetDraft>;
  extraSetsByExercise: Record<string, number>;
  isSignalExecution: boolean;
  navigateHome: () => void;
  pendingCompletedSetKeys: Set<string>;
  queryClient: QueryClient;
  refetchSession: () => void;
  refetchWorkout: () => void;
  resetRestTimer: () => void;
  sessionId: string | null | undefined;
  signalSessionScope: SignalWorkoutSessionScope | null;
  userId: string | null | undefined;
  workoutPlan: WorkoutPlanForToday | null | undefined;
};

export function useSignalSaveAndExit({
  completedSetNumbersByExercise,
  completeSetMutationIsPending,
  drafts,
  extraSetsByExercise,
  isSignalExecution,
  navigateHome,
  pendingCompletedSetKeys,
  queryClient,
  refetchSession,
  refetchWorkout,
  resetRestTimer,
  sessionId,
  signalSessionScope,
  userId,
  workoutPlan,
}: UseSignalSaveAndExitInput) {
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);

  async function flushWorkoutDraftsBeforeExit() {
    if (!sessionId || !workoutPlan || !isSignalExecution) return 0;

    let savedCount = 0;

    for (const exercise of workoutPlan.exercises ?? []) {
      const exerciseId = getWorkoutExerciseIdentityKey(exercise);
      const targetSets = getTargetSets(exercise);
      const extraSets = extraSetsByExercise[exerciseId] ?? 0;
      const totalSets = targetSets + extraSets;

      for (let setNumber = 1; setNumber <= totalSets; setNumber += 1) {
        const logKey = buildWorkoutLogKey(exerciseId, setNumber);
        const draft = drafts[logKey] ?? { lbs: "", reps: "", rpe: "" };
        const isAlreadyCompleted = completedSetNumbersByExercise.get(exerciseId)?.has(setNumber) ?? false;
        const isPending = pendingCompletedSetKeys.has(logKey);
        const hasMeaningfulDraft = Boolean(draft.lbs.trim() || draft.reps.trim() || draft.rpe.trim());

        if (isAlreadyCompleted && !isPending) continue;
        if (!hasMeaningfulDraft && !isPending) continue;

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
          await workoutService.completeSet(payload);
          savedCount += 1;
        } catch (error) {
          throw error;
        }
      }
    }

    return savedCount;
  }

  async function saveAndExit() {
    const hasPendingCompletedSetKeys = pendingCompletedSetKeys.size > 0;

    if (completeSetMutationIsPending || hasPendingCompletedSetKeys) {
      Alert.alert("Please wait", "Please wait for the current set to finish saving.");
      return;
    }

    if (!sessionId || isSavingAndExiting) return;
    setIsSavingAndExiting(true);
    try {
      await flushWorkoutDraftsBeforeExit();
      const scopedQueries = signalSessionScope && userId
        ? [
            queryKeys.signalWorkoutSession(
              userId,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionPlan(
              userId,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionStatus(
              userId,
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
          ]
        : [];

      const invalidatePromises = scopedQueries.map((queryKey) =>
        queryClient.invalidateQueries({ exact: true, queryKey }),
      );
      invalidatePromises.push(queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-plan"] }));
      invalidatePromises.push(queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-status"] }));
      if (sessionId) {
        invalidatePromises.push(queryClient.invalidateQueries({ exact: true, queryKey: queryKeys.workoutSession(sessionId) }));
      }
      if (userId) {
        invalidatePromises.push(queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }));
      }
      await Promise.all(invalidatePromises);

      resetRestTimer();
      navigateHome();
    } catch {
      Alert.alert(
        "Could not save session",
        "We could not save your latest workout changes before leaving. Please stay on the workout screen and try again.",
      );
      refetchWorkout();
      refetchSession();
    } finally {
      setIsSavingAndExiting(false);
    }
  }

  return {
    isSavingAndExiting,
    saveAndExit,
  };
}
