import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import type { SignalWorkoutSessionScope, WorkoutPlanForToday } from "@/src/services/workout.service";
import { workoutService } from "@/src/services";

export function useWorkoutSessionStatus(
  workoutPlan: WorkoutPlanForToday | null | undefined,
  signalScope?: SignalWorkoutSessionScope | null,
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const workoutDayKey = workoutPlan?.source_day_key ?? workoutPlan?.day.id ?? null;
  const isSignalScoped = Boolean(signalScope && userId);

  return useQuery({
    enabled: Boolean(userId && workoutPlan?.program.id && workoutDayKey),
    queryKey:
      userId && isSignalScoped && signalScope
        ? queryKeys.signalWorkoutSessionStatus(
            userId,
            signalScope.activeProgramId,
            signalScope.sourceProgramId,
            signalScope.sourceProgramVersion,
            signalScope.sourceWeekKey,
            signalScope.sourceDayKey,
          )
        : userId && workoutPlan
          ? queryKeys.workoutSessionStatus(userId, workoutPlan.program.id, workoutDayKey ?? workoutPlan.day.id)
          : (["workout", "session-status", "anonymous"] as const),
    queryFn: async () => {
      if (!userId || !workoutPlan) return null;
      if (isSignalScoped && signalScope) {
        return workoutService.findActiveSignalWorkoutSession({
          activeProgramId: signalScope.activeProgramId,
          sourceDayKey: signalScope.sourceDayKey,
          sourceProgramId: signalScope.sourceProgramId,
          sourceProgramVersion: signalScope.sourceProgramVersion,
          sourceWeekKey: signalScope.sourceWeekKey,
          userId,
        });
      }
      return workoutService.findActiveWorkoutSession({
        dayId: workoutDayKey ?? workoutPlan.day.id,
        programId: workoutPlan.program.id,
        userId,
      });
    },
    staleTime: 1000 * 15,
  });
}
