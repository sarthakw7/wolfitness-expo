import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";
import type { SignalWorkoutSessionScope } from "@/src/services/workout.service";

export function useWorkoutActiveSession(signalScope?: SignalWorkoutSessionScope | null) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const isSignalScoped = Boolean(signalScope && userId);

  return useQuery({
    enabled: Boolean(userId),
    queryKey:
      userId && isSignalScoped && signalScope
        ? queryKeys.signalWorkoutSession(
            userId,
            signalScope.activeProgramId,
            signalScope.sourceProgramId,
            signalScope.sourceProgramVersion,
            signalScope.sourceWeekKey,
            signalScope.sourceDayKey,
          )
        : userId
          ? queryKeys.workoutActiveSession(userId)
          : (["workout", "active-session", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) return null;
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
      return workoutService.findAnyActiveWorkoutSession(userId);
    },
    staleTime: 1000 * 15,
  });
}
