import { useQuery } from "@tanstack/react-query";

import { getPrograms } from "@/src/services/programs";
import type { ProgramSummary, ProgramsError } from "@/src/services/programs";

const publishedProgramsKey = ["signal", "programs", "published"] as const;

function shouldRetryProgramsQuery(error: ProgramsError) {
  return error.code === "INTERNAL_ERROR";
}

export function usePrograms() {
  return useQuery<ProgramSummary[], ProgramsError>({
    queryFn: () => getPrograms(),
    queryKey: publishedProgramsKey,
    retry: (failureCount, error) => shouldRetryProgramsQuery(error) && failureCount < 2,
    staleTime: 1000 * 60 * 10,
  });
}
