import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { activeProgramService } from "@/src/services";
import type { StartSignalProgramInput } from "@/src/services/active-program.service";

export function useStartSignalProgram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: Omit<StartSignalProgramInput, "userId">) => {
      if (!userId) throw new Error("Not authenticated.");
      console.log("[SignalEnrollment] re-enroll latest version", {
        programId: input.signalProgramId,
        versionId: input.signalProgramVersion ?? null,
      });
      return activeProgramService.startSignalProgram({ ...input, userId });
    },
    onSuccess: async (_data, variables) => {
      if (!userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-program", userId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session"] }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["workout", "signal-session-status"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
        queryClient.invalidateQueries({ queryKey: ["signal", "program-progress", userId] }),
        queryClient.invalidateQueries({ queryKey: ["signal", "programs", "workout", variables.signalProgramId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
      ]);
    },
  });
}
