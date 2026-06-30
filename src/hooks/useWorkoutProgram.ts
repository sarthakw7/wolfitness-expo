import { useQuery } from "@tanstack/react-query";

import { getWorkoutProgram } from "@/src/services/programs";
import type { ProgramsError, WorkoutProgramPayload } from "@/src/services/programs";

const workoutProgramKey = (programId: string) => ["signal", "programs", "workout", programId] as const;

function shouldRetryWorkoutProgramQuery(error: ProgramsError) {
  return error.code === "INTERNAL_ERROR";
}

export function useWorkoutProgram(programId: string | null | undefined) {
  return useQuery<WorkoutProgramPayload, ProgramsError>({
    enabled: Boolean(programId),
    queryFn: () => {
      if (!programId) {
        throw new Error("Program ID is required.");
      }

      return getWorkoutProgram(programId);
    },
    queryKey: programId ? workoutProgramKey(programId) : workoutProgramKey("anonymous"),
    retry: (failureCount, error) => shouldRetryWorkoutProgramQuery(error) && failureCount < 2,
    staleTime: 1000 * 60 * 5,
  });
}
