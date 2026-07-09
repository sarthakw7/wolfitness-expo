import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";

import { invalidateSignalLifecycleQueries } from "../lib/invalidateSignalLifecycleQueries";
import { resetActiveSignalProgram } from "../services/signalProgramLifecycle.service";

type ResetSignalProgramInput = {
  activeProgramId: string;
  firstPlayableStart: { dayKey: string; weekKey: string };
  signalProgramId: string;
  signalProgramVersion: string | null;
};

export function useResetSignalProgram(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ResetSignalProgramInput) => {
      if (!userId) throw new Error("Not authenticated.");
      return resetActiveSignalProgram({
        activeProgramId: input.activeProgramId,
        firstPlayableStart: input.firstPlayableStart,
        signalProgramId: input.signalProgramId,
        signalProgramVersion: input.signalProgramVersion,
        userId,
      });
    },
    onSuccess: async (result, variables) => {
      if (!userId) return;
      queryClient.setQueryData(["active-program", userId], result);
      queryClient.setQueryData(queryKeys.signalProgramLifecycle(userId), result);
      queryClient.setQueriesData(
        { queryKey: ["signal", "program-progress", userId] },
        (current) =>
          current && typeof current === "object"
            ? { ...(current as Record<string, unknown>), lifecycle: result }
            : current,
      );
      await invalidateSignalLifecycleQueries(queryClient, userId, variables.signalProgramId);
    },
  });
}
