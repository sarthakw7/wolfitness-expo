import { useQuery } from "@tanstack/react-query";

import { activeProgramService } from "@/src/services";
import type { ActiveProgramRow } from "@/src/services/active-program.service";

export function useActiveProgram(userId?: string) {
  return useQuery<ActiveProgramRow | null>({
    enabled: Boolean(userId),
    queryKey: ["active-program", userId ?? null] as const,
    queryFn: async () => {
      if (!userId) return null;
      return activeProgramService.getActiveProgram(userId);
    },
    staleTime: 1000 * 30,
  });
}
