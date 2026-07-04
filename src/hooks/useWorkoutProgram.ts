import { useQuery } from "@tanstack/react-query";

import { getWorkoutProgram } from "@/src/services/programs";
import type { ProgramsError, WorkoutProgramPayload } from "@/src/services/programs";

const workoutProgramKey = (programId: string, versionId?: string | null) =>
  ["signal", "programs", "workout", programId, versionId?.trim() || "latest"] as const;

function shouldRetryWorkoutProgramQuery(error: ProgramsError) {
  return error.code === "INTERNAL_ERROR";
}

export function useWorkoutProgram(programId: string | null | undefined, versionId?: string | null) {
  return useQuery<WorkoutProgramPayload, ProgramsError>({
    enabled: Boolean(programId),
    queryFn: () => {
      if (!programId) {
        throw new Error("Program ID is required.");
      }

      if (__DEV__) {
        console.log("[useWorkoutProgram] query", { programId, versionId: versionId ?? null });
      }

      return getWorkoutProgram(programId, versionId);
    },
    queryKey: programId ? workoutProgramKey(programId, versionId) : workoutProgramKey("anonymous"),
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => shouldRetryWorkoutProgramQuery(error) && failureCount < 2,
    staleTime: 0,
  });
}
