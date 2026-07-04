import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { activeProgramService, workoutService } from "@/src/services";

type ResetSignalEnrollmentInput = {
  activeProgramId: string;
  signalProgramId: string;
  signalProgramVersion?: string | null;
};

export function useResetSignalEnrollment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: ResetSignalEnrollmentInput) => {
      if (!userId) throw new Error("Not authenticated.");

      console.log("[SignalEnrollment] reset requested", {
        activeProgramId: input.activeProgramId,
        programId: input.signalProgramId,
        versionId: input.signalProgramVersion ?? null,
      });

      const cleanupResult = await workoutService.clearUnfinishedSignalWorkoutSessionsForActiveProgram({
        activeProgramId: input.activeProgramId,
        userId,
      });

      await activeProgramService.resetSignalEnrollment({
        activeProgramId: input.activeProgramId,
        signalProgramId: input.signalProgramId,
        signalProgramVersion: input.signalProgramVersion ?? null,
        userId,
      });

      console.log("[SignalEnrollment] reset complete");

      return {
        cancelledSessionCount: cleanupResult.sessionsDeleted,
        programId: input.signalProgramId,
        versionId: input.signalProgramVersion ?? null,
      };
    },
    onSuccess: async (_result, variables) => {
      if (!userId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-program", userId] }),
        queryClient.invalidateQueries({ queryKey: ["signal", "program-progress", userId] }),
        queryClient.invalidateQueries({ queryKey: ["signal", "programs", "workout", variables.signalProgramId] }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session"] }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session-plan"] }),
        queryClient.resetQueries({ queryKey: ["workout", "signal-session-status"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutActiveSession(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionStatuses() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "7d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressOverview(userId, "30d") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
      ]);
    },
  });
}
