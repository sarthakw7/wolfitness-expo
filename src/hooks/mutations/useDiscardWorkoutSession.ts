import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";
import type { SignalWorkoutSessionScope } from "@/src/services/workout.service";

type DiscardWorkoutSessionInput = {
  sessionId: string;
  signalScope?: SignalWorkoutSessionScope | null;
};

export function useDiscardWorkoutSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: DiscardWorkoutSessionInput) => {
      const { sessionId, signalScope } = input;
      const result = await workoutService.discardWorkoutSession(sessionId);
      return { sessionId, signalScope: signalScope ?? null, status: result.status };
    },
    onSuccess: async ({ sessionId, signalScope, status }) => {
      const exactScopedSignalSessionKey =
        userId && signalScope
          ? queryKeys.signalWorkoutSession(
              userId,
              signalScope.activeProgramId,
              signalScope.sourceProgramId,
              signalScope.sourceProgramVersion,
              signalScope.sourceWeekKey,
              signalScope.sourceDayKey,
            )
          : null;
      const exactScopedSessionPlanKey =
        userId && signalScope
          ? queryKeys.signalWorkoutSessionPlan(
              userId,
              signalScope.activeProgramId,
              signalScope.sourceProgramId,
              signalScope.sourceProgramVersion,
              signalScope.sourceWeekKey,
              signalScope.sourceDayKey,
            )
          : null;
      const exactSessionStatusKey =
        userId && signalScope
          ? queryKeys.signalWorkoutSessionStatus(
              userId,
              signalScope.activeProgramId,
              signalScope.sourceProgramId,
              signalScope.sourceProgramVersion,
              signalScope.sourceWeekKey,
              signalScope.sourceDayKey,
            )
          : null;
      const exactHomeActiveSessionKey = userId ? queryKeys.workoutActiveSession(userId) : null;

      if (__DEV__) {
        console.log("[DiscardCache] clearing exact scoped Signal session keys", {
          exactHomeActiveSessionKey,
          exactScopedSessionPlanKey,
          exactScopedSignalSessionKey,
          exactSessionStatusKey,
          sessionId,
          status,
        });
      }

      if (exactScopedSignalSessionKey) {
        queryClient.setQueryData(exactScopedSignalSessionKey, null);
        await queryClient.removeQueries({ exact: true, queryKey: exactScopedSignalSessionKey });
      }

      if (exactScopedSessionPlanKey) {
        queryClient.setQueryData(exactScopedSessionPlanKey, null);
        await queryClient.removeQueries({ exact: true, queryKey: exactScopedSessionPlanKey });
      }

      if (exactSessionStatusKey) {
        queryClient.setQueryData(exactSessionStatusKey, null);
        await queryClient.removeQueries({ exact: true, queryKey: exactSessionStatusKey });
      }

      if (exactHomeActiveSessionKey) {
        queryClient.setQueryData(exactHomeActiveSessionKey, null);
        await queryClient.removeQueries({ exact: true, queryKey: exactHomeActiveSessionKey });
      }

      await Promise.all([
        queryClient.resetQueries({ queryKey: queryKeys.workoutSession(sessionId) }),
        queryClient.resetQueries({ queryKey: queryKeys.workoutSessionPlans() }),
        queryClient.resetQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session"] }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session-plan"] }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session-status"] }),
      ]);
      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutHistory(userId) }),
          queryClient.resetQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
          queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
          queryClient.invalidateQueries({ queryKey: queryKeys.signalProgramProgress(userId) }),
        ]);
      }
    },
  });
}
