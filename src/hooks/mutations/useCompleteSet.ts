import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { workoutService } from "@/src/services";
import type { WorkoutLogSet } from "@/src/services/workout.service";

type CompleteSetInput = {
  exerciseLibraryId: string;
  repsCompleted?: number | null;
  rpeActual?: number | null;
  sessionId: string;
  setNumber: number;
  weightKg?: number | null;
};

export function useCompleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteSetInput) => {
      return workoutService.completeSet({
        exerciseLibraryId: input.exerciseLibraryId,
        repsCompleted: input.repsCompleted ?? null,
        rpeActual: input.rpeActual ?? null,
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
          rpe_actual: input.rpeActual ?? null,
          session_id: input.sessionId,
          set_number: input.setNumber,
          weight_kg: input.weightKg ?? null,
        };
        queryClient.setQueryData(sessionKey, {
          ...previous,
          logs: [...previous.logs, optimisticRow],
        });
        queryClient.setQueriesData<{ logs: WorkoutLogSet[]; session: { id?: string } | unknown }>(
          { queryKey: queryKeys.workoutSessionPlans() },
          (current) => {
            const session = current?.session as { id?: string } | undefined;
            if (!current || session?.id !== input.sessionId) return current;
            return {
              ...current,
              logs: [...current.logs, optimisticRow],
            };
          },
        );
      }

      return { previous, sessionKey };
    },
    onError: (_error, input, context) => {
      if (context?.previous && context.sessionKey) {
        queryClient.setQueryData(context.sessionKey, context.previous);
        queryClient.setQueriesData<{ logs: WorkoutLogSet[]; session: { id?: string } | unknown }>(
          { queryKey: queryKeys.workoutSessionPlans() },
          (current) => {
            const session = current?.session as { id?: string } | undefined;
            if (!current || session?.id !== input.sessionId) return current;
            return context.previous;
          },
        );
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
        queryClient.setQueriesData<{ logs: WorkoutLogSet[]; session: { id?: string } | unknown }>(
          { queryKey: queryKeys.workoutSessionPlans() },
          (plan) => {
            const session = plan?.session as { id?: string } | undefined;
            if (!plan || session?.id !== input.sessionId) return plan;
            const planWithoutOptimistic = plan.logs.filter(
              (log) =>
                !(
                  log.id.startsWith("optimistic-") &&
                  log.session_id === input.sessionId &&
                  log.exercise_library_id === input.exerciseLibraryId &&
                  log.set_number === input.setNumber
                ),
            );
            return {
              ...plan,
              logs: [...planWithoutOptimistic, data],
            };
          },
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSession(input.sessionId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessionPlans() }),
      ]);
    },
  });
}
