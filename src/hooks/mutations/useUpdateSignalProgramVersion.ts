import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { activeProgramService, workoutService } from "@/src/services";

type UpdateSignalProgramVersionInput = {
  activeProgramId: string;
  nextSignalProgramVersion: string;
  previousSignalProgramVersion?: string | null;
  signalProgramId: string;
};

export function useUpdateSignalProgramVersion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: UpdateSignalProgramVersionInput) => {
      if (!userId) throw new Error("Not authenticated.");

      console.log("[SignalEnrollment] update to latest requested", {
        activeProgramId: input.activeProgramId,
        nextVersionId: input.nextSignalProgramVersion,
        previousVersionId: input.previousSignalProgramVersion ?? null,
        programId: input.signalProgramId,
      });

      const cancelledSessionCount = await workoutService.cancelOpenSignalWorkoutSessions({
        activeProgramId: input.activeProgramId,
        sourceProgramId: input.signalProgramId,
        sourceProgramVersion: input.previousSignalProgramVersion ?? null,
        userId,
      });

      const activeProgram = await activeProgramService.updateSignalProgramVersion({
        activeProgramId: input.activeProgramId,
        nextSignalProgramVersion: input.nextSignalProgramVersion,
        signalProgramId: input.signalProgramId,
        userId,
      });

      console.log("[SignalEnrollment] update to latest complete", {
        activeProgramId: activeProgram.id,
        cancelledSessionCount,
        versionId: activeProgram.source_program_version,
      });

      return {
        activeProgram,
        cancelledSessionCount,
      };
    },
    onSuccess: async (_result, variables) => {
      if (!userId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-program", userId] }),
        queryClient.invalidateQueries({ queryKey: ["signal", "program-progress", userId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.signalProgramLifecycle(userId) }),
        queryClient.invalidateQueries({ queryKey: ["signal", "programs", "workout", variables.signalProgramId] }),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(userId) }),
      ]);
    },
  });
}
