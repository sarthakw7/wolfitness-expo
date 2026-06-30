import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { activeProgramService } from "@/src/services";
import type { AdvanceActiveProgramInput } from "@/src/services/active-program.service";

export function useAdvanceActiveProgramAfterWorkout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: Omit<AdvanceActiveProgramInput, "userId">) => {
      if (!userId) throw new Error("Not authenticated.");
      return activeProgramService.advanceActiveProgramAfterWorkout({ ...input, userId });
    },
    onSuccess: async () => {
      if (!userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-program", userId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.signalProgramProgress(userId) }),
      ]);
    },
  });
}
