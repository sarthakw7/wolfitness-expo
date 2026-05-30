import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import type { WorkoutPlanForToday, WorkoutSession } from "@/src/services/workout.service";
import { workoutService } from "@/src/services";

const TIMER_KEY_PREFIX = "wolfitness:workout:rest-timer";

type RestTimerState = {
  durationSec: number;
  startedAtMs: number;
};

type SessionBundle = {
  logs: Awaited<ReturnType<typeof workoutService.fetchWorkoutLogSets>>;
  session: WorkoutSession;
};

export function useWorkoutSession(workoutPlan: WorkoutPlanForToday | null | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const planKey =
    userId && workoutPlan
      ? queryKeys.workoutSessionPlan(userId, workoutPlan.program.id, workoutPlan.day.id)
      : (["workout", "session-plan", "anonymous"] as const);

  const sessionQuery = useQuery<SessionBundle | null>({
    enabled: Boolean(userId && workoutPlan?.program.id && workoutPlan?.day.id),
    queryKey: planKey,
    queryFn: async () => {
      if (!userId || !workoutPlan) throw new Error("Workout session unavailable.");
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
      const session = await workoutService.getOrCreateWorkoutSession({
        dayId: workoutPlan.day.id,
        programId: workoutPlan.program.id,
        userId,
      });
      const logs = await workoutService.fetchWorkoutLogSets(session.id);
      return { logs, session };
    },
    onSuccess: async (bundle) => {
      queryClient.setQueryData(planKey, bundle);
      queryClient.setQueryData(queryKeys.workoutSession(bundle.session.id), bundle);
      if (userId) {
        queryClient.setQueryData(queryKeys.workoutActiveSession(userId), bundle.session);
      }
      if (userId && workoutPlan) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.workoutSessionStatus(userId, workoutPlan.program.id, workoutPlan.day.id),
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
