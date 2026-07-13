import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export const TIMER_KEY_PREFIX = "wolfitness:workout:rest-timer";

type RestTimerState = {
  durationSec: number;
  startedAtMs: number;
};

export function useSessionRestTimerStorage(sessionId: string | null) {
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
    startRestTimer,
  };
}
