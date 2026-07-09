import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invalidateSignalLifecycleQueries } from "../lib/invalidateSignalLifecycleQueries";
import { unjoinActiveSignalProgram } from "../services/signalProgramLifecycle.service";

type UnjoinSignalProgramInput = {
  activeProgramId: string;
  signalProgramId: string;
};

export function useUnjoinSignalProgram(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UnjoinSignalProgramInput) => {
      if (!userId) throw new Error("Not authenticated.");
      return unjoinActiveSignalProgram({
        activeProgramId: input.activeProgramId,
        signalProgramId: input.signalProgramId,
        userId,
      });
    },
    onSuccess: async (_result, variables) => {
      if (!userId) return;
      await invalidateSignalLifecycleQueries(queryClient, userId, variables.signalProgramId);
    },
  });
}
