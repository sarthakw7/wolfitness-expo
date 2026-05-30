import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";

export function useWorkoutActiveSession() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.workoutActiveSession(userId) : (["workout", "active-session", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) return null;
      return workoutService.findAnyActiveWorkoutSession(userId);
    },
    staleTime: 1000 * 15,
  });
}
