import { useCallback, useEffect, useMemo, useState } from "react";

export type RestTimerStatus = "idle" | "running" | "paused" | "completed";

export type UseRestTimerResult = {
  status: RestTimerStatus;
  remainingSeconds: number | null;
  selectedDurationSeconds: number | null;
  formattedRemaining: string | null;
  isIdle: boolean;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  addSeconds: (seconds: number) => void;
  subtractSeconds: (seconds: number) => void;
  setCustomDuration: (seconds: number) => void;
};

function formatRestTimer(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function clampDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return null;
  const normalized = Math.floor(seconds);
  if (normalized < 1) return null;
  return normalized;
}

export function useRestTimer(): UseRestTimerResult {
  const [status, setStatus] = useState<RestTimerStatus>("idle");
  const [endsAtMs, setEndsAtMs] = useState<number | null>(null);
  const [remainingSecondsSnapshot, setRemainingSecondsSnapshot] = useState<number | null>(null);
  const [selectedDurationSeconds, setSelectedDurationSecondsState] = useState<number | null>(null);
  const [tickMs, setTickMs] = useState(() => Date.now());

  const remainingSeconds = useMemo(() => {
    if (status === "running" && endsAtMs != null) {
      const remaining = Math.ceil((endsAtMs - tickMs) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    if (status === "paused") {
      return remainingSecondsSnapshot ?? 0;
    }
    if (status === "completed") {
      return 0;
    }
    return null;
  }, [endsAtMs, remainingSecondsSnapshot, status, tickMs]);

  const reset = useCallback(() => {
    setStatus("idle");
    setEndsAtMs(null);
    setRemainingSecondsSnapshot(null);
    setSelectedDurationSecondsState(null);
  }, []);

  const start = useCallback((seconds: number) => {
    const normalized = clampDuration(seconds);
    if (!normalized) return;
    const now = Date.now();
    setTickMs(now);
    setSelectedDurationSecondsState(normalized);
    setRemainingSecondsSnapshot(null);
    setEndsAtMs(now + normalized * 1000);
    setStatus("running");
  }, []);

  const pause = useCallback(() => {
    setTickMs(Date.now());
    setStatus((current) => {
      if (current !== "running" || endsAtMs == null) return current;
      const remaining = Math.ceil((endsAtMs - Date.now()) / 1000);
      setRemainingSecondsSnapshot(remaining > 0 ? remaining : 0);
      setEndsAtMs(null);
      return "paused";
    });
  }, [endsAtMs]);

  const resume = useCallback(() => {
    if (remainingSecondsSnapshot == null || remainingSecondsSnapshot <= 0) return;
    const now = Date.now();
    setTickMs(now);
    setEndsAtMs(now + remainingSecondsSnapshot * 1000);
    setStatus("running");
  }, [remainingSecondsSnapshot]);

  const stop = useCallback(() => {
    setStatus("idle");
    setEndsAtMs(null);
    setRemainingSecondsSnapshot(null);
  }, []);

  const addSeconds = useCallback((seconds: number) => {
    const normalized = clampDuration(seconds);
    if (!normalized) return;

    const now = Date.now();
    if (status === "running" && endsAtMs != null) {
      setEndsAtMs(endsAtMs + normalized * 1000);
      setSelectedDurationSecondsState((current) => (current ?? 0) + normalized);
      setTickMs(now);
      return;
    }

    if (status === "paused") {
      setRemainingSecondsSnapshot((current) => {
        const next = (current ?? 0) + normalized;
        setSelectedDurationSecondsState((selected) => (selected ?? 0) + normalized);
        return next;
      });
    }
  }, [endsAtMs, status]);

  const subtractSeconds = useCallback((seconds: number) => {
    const normalized = clampDuration(seconds);
    if (!normalized) return;

    if (status === "running" && endsAtMs != null) {
      const nextRemaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000) - normalized);
      if (nextRemaining <= 0) {
        setStatus("completed");
        setEndsAtMs(null);
        setRemainingSecondsSnapshot(0);
        setSelectedDurationSecondsState((current) => Math.max(0, (current ?? 0) - normalized));
        return;
      }
      const now = Date.now();
      setEndsAtMs(now + nextRemaining * 1000);
      setSelectedDurationSecondsState((current) => Math.max(0, (current ?? 0) - normalized));
      setTickMs(now);
      return;
    }

    if (status === "paused") {
      setRemainingSecondsSnapshot((current) => {
        const next = Math.max(0, (current ?? 0) - normalized);
        if (next === 0) {
          setStatus("completed");
        }
        setSelectedDurationSecondsState((selected) => Math.max(0, (selected ?? 0) - normalized));
        return next;
      });
    }
  }, [endsAtMs, status]);

  const setCustomDuration = useCallback((seconds: number) => {
    const normalized = clampDuration(seconds);
    if (!normalized) return;
    setSelectedDurationSecondsState(normalized);
  }, []);

  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setTickMs(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status !== "running" || remainingSeconds == null) return;
    if (remainingSeconds > 0) return;

    setStatus("completed");
    setEndsAtMs(null);
    setRemainingSecondsSnapshot(0);
  }, [remainingSeconds, status]);

  useEffect(() => {
    if (status !== "completed") return;

    const timeout = setTimeout(() => {
      setStatus("idle");
      setEndsAtMs(null);
      setRemainingSecondsSnapshot(null);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [status]);

  return {
    addSeconds,
    formattedRemaining: remainingSeconds != null ? formatRestTimer(remainingSeconds) : null,
    isCompleted: status === "completed",
    isIdle: status === "idle",
    isPaused: status === "paused",
    isRunning: status === "running",
    pause,
    remainingSeconds,
    reset,
    resume,
    selectedDurationSeconds,
    setCustomDuration,
    start,
    status,
    stop,
    subtractSeconds,
  };
}
