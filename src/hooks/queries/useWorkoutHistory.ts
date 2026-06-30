import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { progressService } from "@/src/services";

export function useWorkoutHistory(userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.id ?? null;

  return useQuery({
    enabled: Boolean(resolvedUserId),
    queryKey: resolvedUserId ? queryKeys.workoutHistory(resolvedUserId) : (["workout-history", "anonymous"] as const),
    queryFn: async () => {
      if (!resolvedUserId) return [];
      return progressService.fetchWorkoutHistory(resolvedUserId);
    },
    staleTime: 1000 * 30,
  });
}
