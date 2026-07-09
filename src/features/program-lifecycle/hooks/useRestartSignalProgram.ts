import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSignalLifecycleQueries } from "../lib/invalidateSignalLifecycleQueries";
import { restartCompletedSignalProgram } from "../services/signalProgramLifecycle.service";

type RestartSignalProgramInput = {
  completedLifecycleId: string;
  firstPlayableStart: { dayKey: string; weekKey: string };
  signalProgramId: string;
  signalProgramVersion: string | null;
};

export function useRestartSignalProgram(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RestartSignalProgramInput) => {
      if (!userId) throw new Error("Not authenticated.");
      return restartCompletedSignalProgram({
        completedLifecycleId: input.completedLifecycleId,
        firstPlayableStart: input.firstPlayableStart,
        signalProgramId: input.signalProgramId,
        signalProgramVersion: input.signalProgramVersion,
        userId,
      });
    },
    onSuccess: async (_result, variables) => {
      if (!userId) return;
      await invalidateSignalLifecycleQueries(queryClient, userId, variables.signalProgramId);
    },
  });
}
