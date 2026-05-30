import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { progressService } from "@/src/services";
import type { ProgressRange } from "@/src/services/progress.service";

export function useProgressOverview(range: ProgressRange = "7d") {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.progressOverview(userId, range) : (["progress", "overview", "anonymous", range] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return progressService.fetchProgressOverview(userId, range);
    },
    staleTime: 1000 * 30,
  });
}
