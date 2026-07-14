import { useCallback, useEffect, useState } from "react";

import { kgToLbs } from "@/src/features/workout/lib/weightConversion";
import {
  buildWorkoutLogKey,
  getWorkoutExerciseIdentityKey,
  getWorkoutLogIdentityKey,
} from "@/src/features/workout/lib/workoutLogIdentity";
import { getTargetSets } from "@/src/features/workout/lib/workoutPrescription";
import type {
  WorkoutLogSet,
  WorkoutPlanForToday,
} from "@/src/features/workout/services/workoutTypes";

type SetDraft = {
  lbs: string;
  reps: string;
  rpe: string;
};

type SetDraftField = keyof SetDraft;

type ResetSetStateOptions = {
  includeNotes?: boolean;
};

type UseWorkoutSetStateInput = {
  normalizedLogs: WorkoutLogSet[];
  sessionId: string | null | undefined;
  signalDayId: string | null | undefined;
  signalInitialStepIndex: number;
  signalWeekId: string | null | undefined;
  workoutPlan: WorkoutPlanForToday | null | undefined;
};

const EMPTY_DRAFT: SetDraft = { lbs: "", reps: "", rpe: "" };

export function useWorkoutSetState({
  normalizedLogs,
  sessionId,
  signalDayId,
  signalInitialStepIndex,
  signalWeekId,
  workoutPlan,
}: UseWorkoutSetStateInput) {
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [extraSetsByExercise, setExtraSetsByExercise] = useState<Record<string, number>>({});
  const [pendingCompletedSetKeys, setPendingCompletedSetKeys] = useState<Set<string>>(() => new Set());

  const updateSetDraft = useCallback((draftKey: string, field: SetDraftField, value: string) => {
    setSetDrafts((current) => ({
      ...current,
      [draftKey]: { ...(current[draftKey] ?? EMPTY_DRAFT), [field]: value },
    }));
  }, []);

  const updateExerciseNote = useCallback((exerciseId: string, note: string) => {
    setExerciseNotes((current) => ({
      ...current,
      [exerciseId]: note,
    }));
  }, []);

  const addExtraSet = useCallback((exerciseId: string) => {
    setExtraSetsByExercise((current) => ({
      ...current,
      [exerciseId]: (current[exerciseId] ?? 0) + 1,
    }));
  }, []);

  const removeExtraSet = useCallback((exerciseId: string) => {
    setExtraSetsByExercise((current) => ({
      ...current,
      [exerciseId]: Math.max(0, (current[exerciseId] ?? 0) - 1),
    }));
  }, []);

  const markSetPending = useCallback((logKey: string) => {
    setPendingCompletedSetKeys((current) => {
      const next = new Set(current);
      next.add(logKey);
      return next;
    });
  }, []);

  const clearSetPending = useCallback((logKey: string) => {
    setPendingCompletedSetKeys((current) => {
      const next = new Set(current);
      next.delete(logKey);
      return next;
    });
  }, []);

  const resetSetState = useCallback((options: ResetSetStateOptions = {}) => {
    setSetDrafts({});
    setExtraSetsByExercise({});
    setPendingCompletedSetKeys(new Set());
    if (options.includeNotes ?? true) {
      setExerciseNotes({});
    }
  }, []);

  useEffect(() => {
    resetSetState();
  }, [resetSetState, signalDayId, signalInitialStepIndex, signalWeekId]);

  useEffect(() => {
    setSetDrafts({});
  }, [sessionId, signalDayId, signalWeekId]);

  useEffect(() => {
    if (!normalizedLogs.length) return;

    setSetDrafts((current) => {
      const next = { ...current };
      normalizedLogs.forEach((log) => {
        const draftKey = buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number);
        if (next[draftKey]) return;
        next[draftKey] = {
          lbs: log.weight_kg != null ? String(Math.round(kgToLbs(Number(log.weight_kg)))) : "",
          reps: log.reps_completed != null ? String(log.reps_completed) : "",
          rpe: log.rpe_actual != null ? String(log.rpe_actual) : "",
        };
      });
      return next;
    });
  }, [normalizedLogs]);

  useEffect(() => {
    if (!workoutPlan?.exercises?.length || !normalizedLogs.length) return;

    setExtraSetsByExercise((current) => {
      const next = { ...current };
      let changed = false;

      workoutPlan.exercises.forEach((exercise) => {
        const exerciseId = getWorkoutExerciseIdentityKey(exercise);
        const targetSets = getTargetSets(exercise);
        const inferredExtraSets = normalizedLogs.reduce((max, log) => {
          if (getWorkoutLogIdentityKey(log) !== exerciseId) return max;
          return Math.max(max, log.set_number - targetSets);
        }, 0);
        const currentExtraSets = next[exerciseId] ?? 0;
        if (inferredExtraSets > currentExtraSets) {
          next[exerciseId] = inferredExtraSets;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [normalizedLogs, workoutPlan?.exercises]);

  useEffect(() => {
    if (pendingCompletedSetKeys.size === 0) return;

    setPendingCompletedSetKeys((current) => {
      const next = new Set(current);
      normalizedLogs.forEach((log) => {
        next.delete(buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number));
      });
      return next.size === current.size ? current : next;
    });
  }, [normalizedLogs, pendingCompletedSetKeys.size]);

  return {
    addExtraSet,
    clearSetPending,
    exerciseNotes,
    extraSetsByExercise,
    markSetPending,
    pendingCompletedSetKeys,
    removeExtraSet,
    resetSetState,
    setDrafts,
    updateExerciseNote,
    updateSetDraft,
  };
}
