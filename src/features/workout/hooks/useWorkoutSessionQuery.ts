import { type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  isMatchingSignalActiveProgram,
  logSignalWorkoutValidationIssue,
} from "@/src/features/signal-programs/lib/activeSignalProgram";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { activeProgramService, workoutService } from "@/src/services";
import type {
  SignalWorkoutSessionScope,
  WorkoutPlanForToday,
  WorkoutSession,
} from "@/src/services/workout.service";

export type WorkoutSessionBundle = {
  logs: Awaited<ReturnType<typeof workoutService.fetchWorkoutLogSets>>;
  session: WorkoutSession;
};

type UseWorkoutSessionQueryInput = {
  isSignalWorkout: boolean;
  planKey: QueryKey;
  signalSessionScope?: SignalWorkoutSessionScope | null;
  userId: string | null;
  workoutPlan: WorkoutPlanForToday | null | undefined;
};

export function useWorkoutSessionQuery({
  isSignalWorkout,
  planKey,
  signalSessionScope,
  userId,
  workoutPlan,
}: UseWorkoutSessionQueryInput) {
  const queryClient = useQueryClient();

  return useQuery<WorkoutSessionBundle | null>({
    enabled: Boolean(userId && workoutPlan?.program.id && workoutPlan?.day.id && (!isSignalWorkout || signalSessionScope)),
    queryKey: planKey,
    queryFn: async () => {
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
        const session = await workoutService.findActiveSignalWorkoutSession({
          activeProgramId: signalSessionScope.activeProgramId,
          sourceDayKey: signalSessionScope.sourceDayKey,
          sourceProgramId: signalSessionScope.sourceProgramId,
          sourceProgramVersion: signalSessionScope.sourceProgramVersion,
          sourceWeekKey: signalSessionScope.sourceWeekKey,
          userId,
        });
        if (!session) return null;
        const logs = await workoutService.fetchWorkoutLogSets(session.id);
        const bundle = { logs, session };
        queryClient.setQueryData(
          queryKeys.signalWorkoutSession(
            userId,
            signalSessionScope.activeProgramId,
            signalSessionScope.sourceProgramId,
            signalSessionScope.sourceProgramVersion,
            signalSessionScope.sourceWeekKey,
            signalSessionScope.sourceDayKey,
          ),
          session,
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
          session,
        );
        queryClient.setQueryData(planKey, bundle);
        queryClient.setQueryData(queryKeys.workoutSession(session.id), bundle);
        return bundle;
      }

      const session = await workoutService.findActiveWorkoutSession({
        dayId: workoutPlan.day.id,
        programId: workoutPlan.program.id,
        userId,
      });
      if (!session) return null;
      const logs = await workoutService.fetchWorkoutLogSets(session.id);
      const bundle = { logs, session };
      queryClient.setQueryData(queryKeys.workoutSession(session.id), bundle);
      return bundle;
    },
    staleTime: 1000 * 15,
  });
}
