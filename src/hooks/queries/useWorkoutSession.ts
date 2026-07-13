import { useCallback } from "react";

import { resolveSignalWorkoutSessionKeys } from "@/src/features/signal-programs/lib/activeSignalProgram";
import { useSessionRestTimerStorage } from "@/src/features/workout/hooks/useSessionRestTimerStorage";
import { useStartWorkoutSessionMutation } from "@/src/features/workout/hooks/useStartWorkoutSessionMutation";
import { useWorkoutSessionQuery } from "@/src/features/workout/hooks/useWorkoutSessionQuery";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import type {
  SignalWorkoutSessionScope,
  WorkoutPlanForToday,
} from "@/src/services/workout.service";

export function useWorkoutSession(
  workoutPlan: WorkoutPlanForToday | null | undefined,
  signalSessionScope?: SignalWorkoutSessionScope | null,
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isSignalWorkout = Boolean(workoutPlan?.program.creator_id === "signal");
  const signalWorkoutKeys = workoutPlan ? resolveSignalWorkoutSessionKeys(workoutPlan) : null;
  const isScopedSignalWorkout =
    Boolean(isSignalWorkout && signalSessionScope) && signalSessionScope?.sourceProgramId === workoutPlan?.program.id;

  const planKey =
    userId && workoutPlan
      ? isScopedSignalWorkout && signalSessionScope
        ? queryKeys.signalWorkoutSessionPlan(
            userId,
            signalSessionScope.activeProgramId,
            signalSessionScope.sourceProgramId,
            signalSessionScope.sourceProgramVersion,
            signalSessionScope.sourceWeekKey,
            signalSessionScope.sourceDayKey,
          )
        : queryKeys.workoutSessionPlan(userId, workoutPlan.program.id, signalWorkoutKeys?.dayKey ?? workoutPlan.day.id)
      : (["workout", "session-plan", "anonymous"] as const);

  const sessionQuery = useWorkoutSessionQuery({
    isSignalWorkout,
    planKey,
    signalSessionScope,
    userId,
    workoutPlan,
  });
  const sessionId = sessionQuery.data?.session.id ?? null;
  const startSessionMutation = useStartWorkoutSessionMutation({
    isSignalWorkout,
    planKey,
    signalSessionScope,
    signalWorkoutKeys,
    userId,
    workoutPlan,
  });

  const startSession = useCallback(async () => {
    const bundle = await startSessionMutation.mutateAsync();
    return bundle.session;
  }, [startSessionMutation]);

  const { clearRestTimer, remainingRestSec, startRestTimer } = useSessionRestTimerStorage(sessionId);

  return {
    clearRestTimer,
    remainingRestSec,
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
    startRestTimer,
  };
}
