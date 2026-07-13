import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  isMatchingSignalActiveProgram,
  logSignalWorkoutValidationIssue,
} from "@/src/features/signal-programs/lib/activeSignalProgram";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { activeProgramService, workoutService } from "@/src/services";
import type {
  SignalWorkoutSessionScope,
  WorkoutPlanForToday,
} from "@/src/services/workout.service";

type SignalWorkoutSessionKeys = {
  dayKey: string;
  weekKey: string;
};

type UseStartWorkoutSessionMutationInput = {
  isSignalWorkout: boolean;
  planKey: QueryKey;
  signalSessionScope?: SignalWorkoutSessionScope | null;
  signalWorkoutKeys: SignalWorkoutSessionKeys | null;
  userId: string | null;
  workoutPlan: WorkoutPlanForToday | null | undefined;
};

export function useStartWorkoutSessionMutation({
  isSignalWorkout,
  planKey,
  signalSessionScope,
  signalWorkoutKeys,
  userId,
  workoutPlan,
}: UseStartWorkoutSessionMutationInput) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId || !workoutPlan) throw new Error("Workout session unavailable.");
      if (isSignalWorkout) {
        if (!signalSessionScope) {
          logSignalWorkoutValidationIssue("Signal workout session scope unavailable.", {
            workoutProgramId: workoutPlan.program.id,
          });
          throw new Error("Signal workout session scope unavailable.");
        }
        const activeProgram = await activeProgramService.continueActiveProgram(userId);
        if (!activeProgram || !isMatchingSignalActiveProgram(activeProgram, workoutPlan)) {
          logSignalWorkoutValidationIssue("Active Signal program does not match this program.", {
            activeProgramId: activeProgram?.id ?? null,
            activeProgramSourceProgramId: activeProgram?.source_program_id ?? null,
            workoutProgramId: workoutPlan.program.id,
          });
          throw new Error("Active Signal program does not match this program.");
        }
        try {
          const payload = {
            activeProgramId: signalSessionScope.activeProgramId,
            sourceDayKey: signalSessionScope.sourceDayKey,
            sourceProgramId: signalSessionScope.sourceProgramId,
            sourceProgramVersion: signalSessionScope.sourceProgramVersion,
            sourceWeekKey: signalSessionScope.sourceWeekKey,
            userId,
          };
          console.log("[SignalSessionScope] creating session payload", payload);
          const session = await workoutService.getOrCreateSignalWorkoutSession(payload);
          const logs = await workoutService.fetchWorkoutLogSets(session.id);
          return { logs, session };
        } catch (error) {
          console.log("[BeginLoggingDebug] raw start error", {
            code: error instanceof Error ? (error as { code?: string }).code ?? null : null,
            details: error instanceof Error ? (error as { details?: string }).details ?? null : null,
            hint: error instanceof Error ? (error as { hint?: string }).hint ?? null : null,
            json: JSON.stringify(error, null, 2),
            message: error instanceof Error ? error.message : String(error),
            name: error instanceof Error ? error.name : typeof error,
            stack: error instanceof Error ? error.stack ?? null : null,
          });
          throw error instanceof Error ? error : new Error(String(error));
        }
      }

      const session = await workoutService.getOrCreateWorkoutSession({
        dayId: workoutPlan.day.id,
        programId: workoutPlan.program.id,
        userId,
      });
      const logs = await workoutService.fetchWorkoutLogSets(session.id);
      return { logs, session };
    },
    onSuccess: async (bundle) => {
      console.log("[BeginLoggingDebug] startSession success", {
        active_program_id: bundle.session.active_program_id,
        sessionId: bundle.session.id,
        source_day_key: bundle.session.source_day_key,
        source_program_version: bundle.session.source_program_version,
        source_week_key: bundle.session.source_week_key,
      });
      queryClient.setQueryData(planKey, bundle);
      if (isSignalWorkout && signalSessionScope && userId) {
        queryClient.setQueryData(
          queryKeys.signalWorkoutSession(
            userId,
            signalSessionScope.activeProgramId,
            signalSessionScope.sourceProgramId,
            signalSessionScope.sourceProgramVersion,
            signalSessionScope.sourceWeekKey,
            signalSessionScope.sourceDayKey,
          ),
          bundle.session,
        );
        queryClient.setQueryData(
          queryKeys.signalWorkoutSessionStatus(
            userId,
            signalSessionScope.activeProgramId,
            signalSessionScope.sourceProgramId,
            signalSessionScope.sourceProgramVersion,
            signalSessionScope.sourceWeekKey,
            signalSessionScope.sourceDayKey,
          ),
          bundle.session,
        );
      }
      queryClient.setQueryData(queryKeys.workoutSession(bundle.session.id), bundle);
      if (userId) {
        queryClient.setQueryData(queryKeys.workoutActiveSession(userId), bundle.session);
      }
      if (userId && workoutPlan) {
        await queryClient.invalidateQueries({
          queryKey:
            isSignalWorkout && signalSessionScope
              ? queryKeys.signalWorkoutSessionStatus(
                  userId,
                  signalSessionScope.activeProgramId,
                  signalSessionScope.sourceProgramId,
                  signalSessionScope.sourceProgramVersion,
                  signalSessionScope.sourceWeekKey,
                  signalSessionScope.sourceDayKey,
                )
              : queryKeys.workoutSessionStatus(userId, workoutPlan.program.id, signalWorkoutKeys?.dayKey ?? workoutPlan.day.id),
        });
      }
    },
  });
}
