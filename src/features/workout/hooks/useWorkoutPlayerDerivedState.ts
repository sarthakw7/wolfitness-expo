import { useMemo } from "react";

import {
  buildWorkoutLogKey,
  getWorkoutExerciseIdentityKey,
  getWorkoutLogIdentityKey,
} from "@/src/features/workout/lib/workoutLogIdentity";
import { getTargetSets } from "@/src/features/workout/lib/workoutPrescription";
import { calculateWorkoutSummary } from "@/src/features/workout-summary/lib/calculateWorkoutSummary";
import type {
  WorkoutExercise,
  WorkoutLogSet,
  WorkoutPlanForToday,
  WorkoutSession,
} from "@/src/features/workout/services/workoutTypes";

type WorkoutSessionData = {
  logs?: WorkoutLogSet[] | null;
  session: WorkoutSession;
} | null | undefined;

type UseWorkoutPlayerDerivedStateInput = {
  isSignalExecution: boolean;
  sessionData: WorkoutSessionData;
  workoutPlan: WorkoutPlanForToday | null | undefined;
};

export function useWorkoutPlayerDerivedState({
  isSignalExecution,
  sessionData,
  workoutPlan,
}: UseWorkoutPlayerDerivedStateInput) {
  const logs = useMemo<WorkoutLogSet[]>(() => sessionData?.logs ?? [], [sessionData?.logs]);

  const normalizedLogs = useMemo(() => {
    const byKey = new Map<string, WorkoutLogSet>();
    logs.forEach((log) => {
      const key = buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, log);
        return;
      }

      const existingTime = Date.parse(existing.logged_at ?? "") || 0;
      const nextTime = Date.parse(log.logged_at ?? "") || 0;
      if (nextTime >= existingTime) {
        byKey.set(key, log);
      }
    });
    return Array.from(byKey.values()).sort((a, b) => {
      if (getWorkoutLogIdentityKey(a) === getWorkoutLogIdentityKey(b)) {
        return a.set_number - b.set_number;
      }
      return a.logged_at.localeCompare(b.logged_at);
    });
  }, [logs]);

  const completedSetNumbersByExercise = useMemo(() => {
    const map = new Map<string, Set<number>>();
    normalizedLogs.forEach((log) => {
      const identityKey = getWorkoutLogIdentityKey(log);
      const current = map.get(identityKey) ?? new Set<number>();
      current.add(log.set_number);
      map.set(identityKey, current);
    });
    return map;
  }, [normalizedLogs]);

  const exerciseProgress = useMemo(() => {
    const map = new Map<string, number>();
    completedSetNumbersByExercise.forEach((setNumbers, exerciseId) => {
      map.set(exerciseId, setNumbers.size);
    });
    return map;
  }, [completedSetNumbersByExercise]);

  const activeExercise: WorkoutExercise | null = useMemo(() => {
    if (isSignalExecution) return null;
    return workoutPlan?.exercises?.[0] ?? null;
  }, [isSignalExecution, workoutPlan?.exercises]);

  const completedExerciseCount = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return 0;
    return workoutPlan.exercises.filter((item) => {
      const completed = exerciseProgress.get(getWorkoutExerciseIdentityKey(item)) ?? 0;
      const target = getTargetSets(item);
      return target > 0 && completed >= target;
    }).length;
  }, [exerciseProgress, workoutPlan?.exercises]);

  const workoutSummary = useMemo(
    () =>
      sessionData
        ? calculateWorkoutSummary({
            session: sessionData.session,
            sets: normalizedLogs,
          })
        : null,
    [normalizedLogs, sessionData],
  );

  return {
    activeExercise,
    completedExerciseCount,
    completedSetNumbersByExercise,
    normalizedLogs,
    workoutSummary,
  };
}
