import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";

export function useWorkout() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.workout(userId) : (["workout", "active", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated.");
      return workoutService.fetchWorkoutForToday(userId);
    },
    staleTime: 1000 * 30,
  });
}

