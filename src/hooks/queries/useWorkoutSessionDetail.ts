import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { progressService } from "@/src/services";
import type { WorkoutSessionDetail } from "@/src/services/progress.service";

export function useWorkoutSessionDetail(sessionId?: string | null, userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.id ?? null;

  return useQuery<WorkoutSessionDetail | null>({
    enabled: Boolean(resolvedUserId && sessionId),
    queryKey:
      resolvedUserId && sessionId
        ? queryKeys.workoutSessionDetail(resolvedUserId, sessionId)
        : (["workout-session-detail", "anonymous", sessionId ?? null] as const),
    queryFn: async () => {
      if (!resolvedUserId || !sessionId) return null;
      return progressService.fetchWorkoutSessionDetail(resolvedUserId, sessionId);
    },
    staleTime: 1000 * 30,
  });
}
