import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";
import type { WorkoutLogSet } from "@/src/services/workout.service";

type CompleteSetInput = {
  exerciseLibraryId: string;
  repsCompleted?: number | null;
  sessionId: string;
  setNumber: number;
  weightKg?: number | null;
};

export function useCompleteSet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useMutation({
    mutationFn: async (input: CompleteSetInput) => {
      return workoutService.completeSet({
        exerciseLibraryId: input.exerciseLibraryId,
        repsCompleted: input.repsCompleted ?? null,
        sessionId: input.sessionId,
        setNumber: input.setNumber,
        weightKg: input.weightKg ?? null,
      });
    },
    onMutate: async (input) => {
      const sessionKey = queryKeys.workoutSession(input.sessionId);
      await queryClient.cancelQueries({ queryKey: sessionKey });
      const previous = queryClient.getQueryData<{ logs: WorkoutLogSet[]; session: unknown }>(sessionKey);

      if (previous) {
        const optimisticRow: WorkoutLogSet = {
          exercise_library_id: input.exerciseLibraryId,
          id: `optimistic-${input.sessionId}-${input.exerciseLibraryId}-${input.setNumber}`,
          logged_at: new Date().toISOString(),
          reps_completed: input.repsCompleted ?? null,
          rpe_actual: null,
          session_id: input.sessionId,
          set_number: input.setNumber,
          weight_kg: input.weightKg ?? null,
        };
        queryClient.setQueryData(sessionKey, {
          ...previous,
          logs: [...previous.logs, optimisticRow],
        });
      }

      return { previous, sessionKey };
    },
    onError: (_error, _input, context) => {
      if (context?.previous && context.sessionKey) {
        queryClient.setQueryData(context.sessionKey, context.previous);
      }
    },
    onSuccess: async (data, input) => {
      const sessionKey = queryKeys.workoutSession(input.sessionId);
      const current = queryClient.getQueryData<{ logs: WorkoutLogSet[]; session: unknown }>(sessionKey);
      if (current) {
        // Replace optimistic row or append if no optimistic exists.
        const withoutOptimistic = current.logs.filter(
          (log) =>
            !(
              log.id.startsWith("optimistic-") &&
              log.session_id === input.sessionId &&
              log.exercise_library_id === input.exerciseLibraryId &&
              log.set_number === input.setNumber
            ),
        );
        queryClient.setQueryData(sessionKey, {
          ...current,
          logs: [...withoutOptimistic, data],
        });
      }

      if (userId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
          queryClient.invalidateQueries({ queryKey: queryKeys.workout(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
        ]);
      }
    },
  });
}
