import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { activeProgramService, workoutService } from "@/src/services";
import type {
  SignalWorkoutSessionScope,
  WorkoutPlanForToday,
  WorkoutSession,
} from "@/src/services/workout.service";

const TIMER_KEY_PREFIX = "wolfitness:workout:rest-timer";

type RestTimerState = {
  durationSec: number;
  startedAtMs: number;
};

type SessionBundle = {
  logs: Awaited<ReturnType<typeof workoutService.fetchWorkoutLogSets>>;
  session: WorkoutSession;
};

function isMatchingSignalActiveProgram(
  activeProgram: Awaited<ReturnType<typeof activeProgramService.continueActiveProgram>> | null,
  workoutPlan: WorkoutPlanForToday,
) {
  return Boolean(
    activeProgram &&
      activeProgram.source === "signal" &&
      activeProgram.source_program_id === workoutPlan.program.id,
  );
}

function resolveSignalWorkoutSessionKeys(workoutPlan: WorkoutPlanForToday) {
  return {
    dayKey: workoutPlan.source_day_key ?? workoutPlan.day.id,
    weekKey: workoutPlan.source_week_key ?? workoutPlan.week.id,
  };
}

function logSignalWorkoutValidationIssue(message: string, context: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[signal-workout-session]", message, context);
  }
}

export function useWorkoutSession(
  workoutPlan: WorkoutPlanForToday | null | undefined,
  signalSessionScope?: SignalWorkoutSessionScope | null,
) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const isSignalWorkout = Boolean(workoutPlan?.program.creator_id === "signal");
  const signalWorkoutKeys = workoutPlan ? resolveSignalWorkoutSessionKeys(workoutPlan) : null;
  const isScopedSignalWorkout =
    Boolean(isSignalWorkout && signalSessionScope) && signalSessionScope?.sourceProgramId === workoutPlan?.program.id;

  const planKey =
    userId && workoutPlan
      ? isScopedSignalWorkout && signalSessionScope
        ? queryKeys.signalWorkoutSessionPlan(
            userId,
            signalSessionScope.activeProgramId,
            signalSessionScope.sourceProgramId,
            signalSessionScope.sourceProgramVersion,
            signalSessionScope.sourceWeekKey,
            signalSessionScope.sourceDayKey,
          )
        : queryKeys.workoutSessionPlan(userId, workoutPlan.program.id, signalWorkoutKeys?.dayKey ?? workoutPlan.day.id)
      : (["workout", "session-plan", "anonymous"] as const);

  const sessionQuery = useQuery<SessionBundle | null>({
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

  const sessionId = sessionQuery.data?.session.id ?? null;
  const startSessionMutation = useMutation({
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

  const startSession = useCallback(async () => {
    const bundle = await startSessionMutation.mutateAsync();
    return bundle.session;
  }, [startSessionMutation]);

  const timerStorageKey = sessionId ? `${TIMER_KEY_PREFIX}:${sessionId}` : null;
  const [, setTick] = useState(0);
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);

  useEffect(() => {
    if (!timerStorageKey) {
      setRestTimer(null);
      return;
    }
    AsyncStorage.getItem(timerStorageKey)
      .then((raw) => {
        if (!raw) {
          setRestTimer(null);
          return;
        }
        try {
          const parsed = JSON.parse(raw) as RestTimerState;
          if (!parsed?.durationSec || !parsed?.startedAtMs) {
            setRestTimer(null);
            return;
          }
          setRestTimer(parsed);
        } catch {
          setRestTimer(null);
        }
      })
      .catch(() => {
        setRestTimer(null);
      });
  }, [timerStorageKey]);

  useEffect(() => {
    if (!restTimer) return;
    const id = setInterval(() => setTick((current) => current + 1), 1000);
    return () => clearInterval(id);
  }, [restTimer]);

  const remainingRestSec = (() => {
    if (!restTimer) return 0;
    const elapsed = Math.floor((Date.now() - restTimer.startedAtMs) / 1000);
    const remaining = restTimer.durationSec - elapsed;
    return remaining > 0 ? remaining : 0;
  })();

  const startRestTimer = useCallback(
    async (durationSec: number) => {
      if (!timerStorageKey) return;
      const payload: RestTimerState = { durationSec, startedAtMs: Date.now() };
      setRestTimer(payload);
      await AsyncStorage.setItem(timerStorageKey, JSON.stringify(payload));
    },
    [timerStorageKey],
  );

  const clearRestTimer = useCallback(async () => {
    if (timerStorageKey) {
      await AsyncStorage.removeItem(timerStorageKey);
    }
    setRestTimer(null);
  }, [timerStorageKey]);

  useEffect(() => {
    if (remainingRestSec === 0 && restTimer) {
      clearRestTimer().catch(() => {});
    }
  }, [clearRestTimer, remainingRestSec, restTimer]);

  return {
    clearRestTimer,
    remainingRestSec,
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
    startRestTimer,
  };
}
