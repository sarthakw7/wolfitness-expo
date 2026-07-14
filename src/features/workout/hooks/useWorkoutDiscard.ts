import type { QueryClient } from "@tanstack/react-query";

import type { SignalWorkoutSessionScope } from "@/src/features/workout/services/workoutTypes";
import { queryKeys } from "@/src/hooks/queries/queryKeys";

type DiscardWorkoutInput = {
  sessionId: string;
  signalScope?: SignalWorkoutSessionScope | null;
};

type DiscardWorkoutResult = {
  status: string;
};

type UseWorkoutDiscardInput = {
  clearLocalWorkoutState: () => void;
  clearRouteParams: () => void;
  discardWorkoutSession: (input: DiscardWorkoutInput) => Promise<DiscardWorkoutResult>;
  hasStartedSession: boolean;
  hasSessionData: boolean;
  isDiscardingMutation: boolean;
  isFinishLocked: () => boolean;
  navigateHome: () => void;
  queryClient: QueryClient;
  refetchSession: () => void;
  refetchWorkout: () => void;
  resetRestTimer: () => void;
  routeParams: unknown;
  sessionId: string | null | undefined;
  signalSessionScope: SignalWorkoutSessionScope | null;
  userId: string | null | undefined;
};

export function useWorkoutDiscard({
  clearLocalWorkoutState,
  clearRouteParams,
  discardWorkoutSession,
  hasStartedSession,
  hasSessionData,
  isDiscardingMutation,
  isFinishLocked,
  navigateHome,
  queryClient,
  refetchSession,
  refetchWorkout,
  resetRestTimer,
  routeParams,
  sessionId,
  signalSessionScope,
  userId,
}: UseWorkoutDiscardInput) {
  async function discardWorkout() {
    if (!sessionId || isDiscardingMutation || isFinishLocked()) return;
    try {
      console.log("[DiscardDebug] before discard", {
        sessionId,
        hasStartedSession,
        routeParams,
      });

      console.log("[DiscardDebug] service deleting", { sessionId });
      const result = await discardWorkoutSession({
        sessionId,
        signalScope: signalSessionScope,
      });
      console.log("[DiscardDebug] after service discard", { sessionId });

      console.log("[DiscardDebug] discard result handled in UI", {
        status: result.status,
        sessionId,
      });

      const resetKeys = [queryKeys.workoutSession(sessionId), queryKeys.workoutSessionPlans(), queryKeys.workoutSessionStatuses()] as const;
      const signalResetKeys = signalSessionScope
        ? [
            queryKeys.signalWorkoutSession(
              userId ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionPlan(
              userId ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionStatus(
              userId ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
          ]
        : [];
      const broadSignalResetKeys = [["workout", "signal-session"], ["workout", "signal-session-plan"], ["workout", "signal-session-status"]] as const;
      const combinedResetKeys = [...resetKeys, ...signalResetKeys, ...broadSignalResetKeys];
      console.log("[DiscardDebug] reset exact query keys", { keys: combinedResetKeys });

      const resetPromises = combinedResetKeys.map((queryKey) => queryClient.resetQueries({ queryKey }));
      if (userId) {
        resetPromises.push(queryClient.resetQueries({ queryKey: queryKeys.workoutActiveSession(userId) }));
      }
      await Promise.all(resetPromises);

      clearLocalWorkoutState();
      resetRestTimer();

      console.log("[DiscardDebug] after local reset", {
        sessionId,
        hasStartedSession: hasSessionData,
      });

      console.log("[DiscardDebug] replacing to workout home");
      clearRouteParams();
      console.log("[SessionAudit][discard]", {
        queriesReset: true,
        routeParamsCleared: true,
        sessionId,
        status: result.status,
      });
      navigateHome();
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "discard-session-action",
      });
      refetchWorkout();
      refetchSession();
    }
  }

  return {
    discardWorkout,
    isDiscarding: isDiscardingMutation,
  };
}
