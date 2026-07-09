import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";

export function useFinishWorkout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await workoutService.finishWorkoutSession(sessionId);
      return sessionId;
    },
    onSuccess: async (sessionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSession(sessionId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session"] }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-status"] }),
      ]);
      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutHistory(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
          queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
          queryClient.invalidateQueries({ queryKey: queryKeys.signalProgramLifecycle(userId) }),
          queryClient.invalidateQueries({ queryKey: ["signal", "program-progress", userId] }),
        ]);
      }
    },
  });
}
