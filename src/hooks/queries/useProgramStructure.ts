import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { workoutService } from "@/src/services";

export function useProgramStructure(programId: string | null | undefined) {
  return useQuery({
    enabled: Boolean(programId),
    queryKey: programId ? queryKeys.programStructure(programId) : (["programs", "structure", "anonymous"] as const),
    queryFn: async () => {
      if (!programId) return [];
      return workoutService.fetchProgramStructure(programId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

