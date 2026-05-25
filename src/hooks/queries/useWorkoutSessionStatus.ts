import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import type { WorkoutPlanForToday } from "@/src/services/workout.service";
import { workoutService } from "@/src/services";

export function useWorkoutSessionStatus(workoutPlan: WorkoutPlanForToday | null | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    enabled: Boolean(userId && workoutPlan?.program.id && workoutPlan?.day.id),
    queryKey:
      userId && workoutPlan
        ? queryKeys.workoutSessionStatus(userId, workoutPlan.program.id, workoutPlan.day.id)
        : (["workout", "session-status", "anonymous"] as const),
    queryFn: async () => {
      if (!userId || !workoutPlan) return null;
      return workoutService.findActiveWorkoutSession({
        dayId: workoutPlan.day.id,
        programId: workoutPlan.program.id,
        userId,
      });
    },
    staleTime: 1000 * 15,
  });
}
