import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router, useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ProgressBar, ScreenScaffold } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { useAdvanceActiveProgramAfterWorkout, useCompleteSet, useFinishWorkout } from "@/src/hooks/mutations";
import { useActiveProgram, useEnrollments, useWorkout, useWorkoutSession } from "@/src/hooks/queries";
import { useAuth } from "@/src/hooks/useAuth";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import type { WorkoutExercise, WorkoutLogSet } from "@/src/services/workout.service";
import {
  buildSignalWorkoutExecutionContext,
  hasSignalWorkoutPayload,
  findNextSignalWorkoutDay,
  resolveSignalWorkoutSelection,
} from "@/src/services/signal-workout-adapter";
import { colors } from "@/src/theme";

function parseTargetReps(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

type WorkoutCompletionSummary = {
  completedDayTitle: string;
  completedExercises: number;
  completedSets: number;
  completedWeekLabel: string;
  isProgramCompleted: boolean;
  nextWorkout: {
    dayId: string;
    dayLabel: string;
    programId: string;
    weekId: string;
    weekLabel: string;
  } | null;
  progressUpdateNeedsRefresh: boolean;
  programTitle: string;
};

function isMatchingSignalActiveProgramPointer(
  activeProgram:
    | {
        current_day_key: string | null;
        current_week_key: string | null;
        source: "legacy" | "signal";
        source_program_id: string;
      }
    | null,
  programId: string | null,
  weekId: string | null,
  dayId: string | null,
) {
  return Boolean(
    activeProgram &&
      activeProgram.source === "signal" &&
      activeProgram.source_program_id === programId &&
      activeProgram.current_week_key === weekId &&
      activeProgram.current_day_key === dayId,
  );
}

function formatDurationWeeks(weeks: number | null | undefined) {
  if (!weeks || weeks <= 0) return "Flexible";
  return `${weeks} Weeks`;
}

function formatRest(remainingSec: number) {
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function lbsToKg(lbs: number) {
  return lbs * 0.45359237;
}

function kgToLbs(kg: number) {
  return kg / 0.45359237;
}

function WorkoutSkeleton() {
  return (
    <View className="gap-gutter">
      <EditorialCard className="min-h-44 bg-surface-muted" />
      <EditorialCard className="min-h-40 bg-surface-muted" />
      <EditorialCard className="min-h-56 bg-surface-muted" />
    </View>
  );
}

function SetRowVariantD({
  completed,
  index,
  isActive,
  lbsValue,
  repsValue,
  setLabel,
  onChangeLbs,
  onChangeReps,
  onToggleComplete,
  weightInputRef,
}: {
  completed: boolean;
  index: number;
  isActive: boolean;
  lbsValue: string;
  repsValue: string;
  setLabel: string;
  onChangeLbs: (next: string) => void;
  onChangeReps: (next: string) => void;
  onToggleComplete: () => void;
  weightInputRef?: (node: TextInput | null) => void;
}) {
  const cardTone = completed
    ? "opacity-70"
    : isActive
      ? "bg-white/90 border-white shadow-luxury"
      : "bg-white/60 border-white/70";

  const indicator = isActive ? <View className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-graphite" /> : null;

  return (
    <GlassCard className={`relative overflow-hidden rounded-2xl border p-4 ${cardTone}`}>
      {indicator}
      <View className={isActive ? "flex-row items-center justify-between gap-3 pl-3" : "flex-row items-center justify-between gap-3"}>
        <View className="flex-row items-center gap-4">
          <Typography tone="secondary" variant="headlineLg">
            {index}
          </Typography>
          <Typography className="uppercase tracking-widest" tone="secondary" variant="labelSm">
            {setLabel}
          </Typography>
        </View>

        <View className="flex-row items-center gap-6">
          <TextInput
            editable={!completed}
            keyboardType="numeric"
            onChangeText={onChangeLbs}
            placeholder="-"
            placeholderTextColor={colors.graphiteSubtle}
            ref={weightInputRef}
            selectionColor={colors.emerald}
            style={[styles.setInput, completed ? styles.setInputCompleted : null, isActive ? styles.setInputActive : null]}
            value={lbsValue}
          />
          <TextInput
            editable={!completed}
            keyboardType="numeric"
            onChangeText={onChangeReps}
            placeholder="-"
            placeholderTextColor={colors.graphiteSubtle}
            selectionColor={colors.emerald}
            style={[styles.setInput, completed ? styles.setInputCompleted : null, isActive ? styles.setInputActive : null]}
            value={repsValue}
          />

          <Pressable
            accessibilityLabel={completed ? "Set complete" : "Mark set complete"}
            accessibilityRole="button"
            className={
              completed
                ? "h-9 w-9 items-center justify-center rounded-full bg-emerald"
                : isActive
                  ? "h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-white/50"
                  : "h-9 w-9 items-center justify-center rounded-full border-2 border-border/50 bg-transparent opacity-60"
            }
            disabled={completed || !isActive}
            hitSlop={8}
            onPress={onToggleComplete}
          >
            <Ionicons color={completed ? colors.white : colors.graphiteMuted} name="checkmark" size={16} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  setInput: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: colors.graphite,
    minWidth: 56,
    paddingBottom: 4,
    textAlign: "center",
  },
  setInputActive: {
    borderBottomColor: colors.graphite,
    borderBottomWidth: 2,
  },
  setInputCompleted: {
    borderBottomColor: colors.border,
    color: colors.graphiteMuted,
  },
});

function WorkoutPlayerScreenComponent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    signalDayId?: string;
    signalProgramId?: string;
    signalWeekId?: string;
  }>();
  const signalProgramId = singleParam(params.signalProgramId);
  const signalWeekId = singleParam(params.signalWeekId);
  const signalDayId = singleParam(params.signalDayId);
  const hasSignalRouteParams = Boolean(signalProgramId || signalWeekId || signalDayId);
  const isSignalExecution = hasSignalRouteParams;

  const enrollmentsQuery = useEnrollments();
  const activeProgramQuery = useActiveProgram(isSignalExecution ? user?.id : undefined);
  const workoutQuery = useWorkout({ enabled: !isSignalExecution });
  const signalWorkoutQuery = useWorkoutProgram(signalProgramId);
  const signalWorkoutPayload = useMemo(
    () => (hasSignalWorkoutPayload(signalWorkoutQuery.data) ? signalWorkoutQuery.data : null),
    [signalWorkoutQuery.data],
  );
  const signalWorkoutSelection = useMemo(
    () =>
      signalWorkoutPayload
        ? resolveSignalWorkoutSelection(signalWorkoutPayload, { dayId: signalDayId, weekId: signalWeekId })
        : null,
    [signalDayId, signalWeekId, signalWorkoutPayload],
  );
  const activeProgram = activeProgramQuery.data ?? null;
  const isActiveProgramLoading = isSignalExecution && activeProgramQuery.isLoading;
  const signalActiveProgramIsValid = isMatchingSignalActiveProgramPointer(
    activeProgram,
    signalProgramId,
    signalWeekId,
    signalDayId,
  );
  const signalWorkoutPlan = useMemo(() => {
    if (
      !isSignalExecution ||
      !user?.id ||
      !signalWorkoutPayload ||
      signalWorkoutSelection?.status !== "ok" ||
      !signalActiveProgramIsValid
    ) {
      return null;
    }
    return buildSignalWorkoutExecutionContext(
      signalWorkoutPayload,
      { dayId: signalDayId, weekId: signalWeekId },
      user.id,
    );
  }, [
    isSignalExecution,
    signalActiveProgramIsValid,
    signalDayId,
    signalWeekId,
    signalWorkoutPayload,
    signalWorkoutSelection?.status,
    user?.id,
  ]);
  const workoutPlan = signalWorkoutPlan ?? workoutQuery.data ?? null;
  const activeSignalProgram =
    activeProgram?.source === "signal" && activeProgram.source_program_id === signalProgramId ? activeProgram : null;
  const {
    clearRestTimer,
    remainingRestSec,
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
    startRestTimer,
  } = useWorkoutSession(workoutPlan);

  const advanceActiveProgramMutation = useAdvanceActiveProgramAfterWorkout();
  const completeSetMutation = useCompleteSet();
  const finishWorkoutMutation = useFinishWorkout();
  const setInputRefs = useRef<Record<number, TextInput | null>>({});
  const finishLockRef = useRef(false);
  const [heldExerciseIndex, setHeldExerciseIndex] = useState<number | null>(null);
  const [setFeedback, setSetFeedback] = useState<string | null>(null);
  const [nextTargetCue, setNextTargetCue] = useState<string | null>(null);
  const [restState, setRestState] = useState<"idle" | "started" | "running" | "complete">("idle");
  const [transitionLabel, setTransitionLabel] = useState<string | null>(null);
  const [completionSummary, setCompletionSummary] = useState<WorkoutCompletionSummary | null>(null);
  const signalProgramErrorCode = getProgramsErrorCode(signalWorkoutQuery.error);
  const signalExecutionIssue = useMemo(() => {
    if (!isSignalExecution) return null;

    if (!signalProgramId) {
      return {
        body: "This workout link is missing a program id.",
        retry: false,
        title: "Invalid workout",
      } as const;
    }

    if (isActiveProgramLoading) {
      return null;
    }

    if (signalWorkoutQuery.error) {
      if (signalProgramErrorCode === "NOT_FOUND") {
        return {
          body: "This workout is no longer published or was removed.",
          retry: true,
          title: "Workout unavailable",
        } as const;
      }

      if (
        signalProgramErrorCode === "PARSE_ERROR" ||
        signalProgramErrorCode === "CONFIGURATION_ERROR" ||
        signalProgramErrorCode === "BAD_REQUEST"
      ) {
        return {
          body: "The Signal API returned an invalid workout payload.",
          retry: true,
          title: "Workout unavailable",
        } as const;
      }

      return {
        body: "Check your connection and try again.",
        retry: true,
        title: "Unable to load workout",
      } as const;
    }

    if (signalWorkoutPayload?.weeks.length === 0) {
      return {
        body: "This published workout does not contain any weeks yet.",
        retry: true,
        title: "Workout unavailable",
      } as const;
    }

    if (!signalWorkoutSelection || signalWorkoutSelection.status !== "ok") {
      return {
        body: "The selected Signal week or day could not be found.",
        retry: false,
        title: "Invalid workout",
      } as const;
    }

    if (activeProgramQuery.error) {
      return {
        body: "We could not load your active Signal program.",
        retry: true,
        title: "Active program unavailable",
      } as const;
    }

    if (isSignalExecution && !signalActiveProgramIsValid) {
      return {
        body: "Your active Signal program does not match this workout. Do not guess a different day.",
        retry: false,
        title: "Active program unavailable",
      } as const;
    }

    return null;
  }, [
    isSignalExecution,
    isActiveProgramLoading,
    signalActiveProgramIsValid,
    signalProgramErrorCode,
    signalProgramId,
    signalWorkoutPayload?.weeks.length,
    activeProgramQuery.error,
    signalWorkoutQuery.error,
    signalWorkoutSelection,
  ]);

  useEffect(() => {
    const failures = [
      ...(!isSignalExecution ? ([
        ["enrollments", enrollmentsQuery.error],
        ["workout", workoutQuery.error],
      ] as const) : []),
      ...(isSignalExecution ? ([["signal-workout", signalWorkoutQuery.error]] as const) : []),
      ["workout-session", sessionQuery.error],
      ["start-session", startSessionMutation.error],
      ["complete-set", completeSetMutation.error],
      ["finish-workout", finishWorkoutMutation.error],
    ].filter(([, error]) => Boolean(error));

    failures.forEach(([type, error]) => {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type,
      });
    });
  }, [
    completeSetMutation.error,
    enrollmentsQuery.error,
    finishWorkoutMutation.error,
    isSignalExecution,
    sessionQuery.error,
    startSessionMutation.error,
    signalWorkoutQuery.error,
    workoutQuery.error,
  ]);

  const isLoading = isSignalExecution
    ? signalWorkoutQuery.isLoading || activeProgramQuery.isLoading || (workoutPlan ? sessionQuery.isLoading : false)
    : enrollmentsQuery.isLoading || workoutQuery.isLoading || (workoutPlan ? sessionQuery.isLoading : false);
  const hasError = isSignalExecution
    ? Boolean(sessionQuery.error)
    : Boolean(enrollmentsQuery.error || workoutQuery.error || sessionQuery.error);
  const activeEnrollment = useMemo(() => {
    if (isSignalExecution) return null;
    return (enrollmentsQuery.data ?? []).find((enrollment) => enrollment.status === "active") ?? null;
  }, [enrollmentsQuery.data, isSignalExecution]);
  const hasWorkoutAccess = isSignalExecution ? Boolean(workoutPlan) : Boolean(activeEnrollment);

  const logs = useMemo<WorkoutLogSet[]>(() => sessionQuery.data?.logs ?? [], [sessionQuery.data?.logs]);
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      const current = map.get(log.exercise_library_id) ?? 0;
      map.set(log.exercise_library_id, Math.max(current, log.set_number));
    });
    return map;
  }, [logs]);

  const currentExerciseIndex = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return 0;
    return workoutPlan.exercises.findIndex((item) => {
      const completed = exerciseProgress.get(item.exercise.id) ?? 0;
      const target = item.prescription.target_sets ?? 0;
      return completed < target;
    });
  }, [exerciseProgress, workoutPlan?.exercises]);

  const safeExerciseIndex =
    currentExerciseIndex >= 0
      ? currentExerciseIndex
      : Math.max(0, (workoutPlan?.exercises?.length ?? 1) - 1);
  const displayExerciseIndex = heldExerciseIndex ?? safeExerciseIndex;

  const activeExercise: WorkoutExercise | null =
    workoutPlan?.exercises?.[displayExerciseIndex] ?? null;

  const completedSetsForActive = activeExercise
    ? exerciseProgress.get(activeExercise.exercise.id) ?? 0
    : 0;
  const targetSetsForActive = activeExercise?.prescription.target_sets ?? 0;
  const isActiveExerciseComplete =
    targetSetsForActive > 0 && completedSetsForActive >= targetSetsForActive;
  const nextSetNumber = Math.min(completedSetsForActive + 1, Math.max(1, targetSetsForActive));

  const repsForLog = parseTargetReps(activeExercise?.prescription.target_reps ?? null);

  const sessionComplete = Boolean(sessionQuery.data?.session.completed_at);
  const hasStartedSession = Boolean(sessionId);
  const disableCompleteSet =
    !sessionId ||
    !activeExercise ||
    targetSetsForActive === 0 ||
    isActiveExerciseComplete ||
    completeSetMutation.isPending ||
    sessionComplete;
  const completedExerciseCount = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return 0;
    return workoutPlan.exercises.filter((item) => {
      const completed = exerciseProgress.get(item.exercise.id) ?? 0;
      const target = item.prescription.target_sets ?? 0;
      return target > 0 && completed >= target;
    }).length;
  }, [exerciseProgress, workoutPlan?.exercises]);
  const completedSetCount = logs.length;

  const activeExerciseLogs = useMemo(() => {
    if (!activeExercise) return [];
    return logs.filter((log) => log.exercise_library_id === activeExercise.exercise.id);
  }, [activeExercise, logs]);

  const [setDrafts, setSetDrafts] = useState<Record<number, { lbs: string; reps: string }>>({});

  useEffect(() => {
    // Reset drafts when the active exercise changes or session changes.
    setSetDrafts({});
  }, [activeExercise?.exercise.id, sessionId]);

  useEffect(() => {
    // Prefill drafts from existing logs when available.
    if (!activeExerciseLogs.length) return;

    setSetDrafts((current) => {
      const next = { ...current };
      activeExerciseLogs.forEach((log) => {
        const setNo = log.set_number;
        if (next[setNo]) return;
        next[setNo] = {
          lbs: log.weight_kg != null ? String(Math.round(kgToLbs(Number(log.weight_kg)))) : "",
          reps: log.reps_completed != null ? String(log.reps_completed) : "",
        };
      });
      return next;
    });
  }, [activeExerciseLogs]);

  const allExercisesComplete = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return false;
    return workoutPlan.exercises.every((item) => {
      const completed = exerciseProgress.get(item.exercise.id) ?? 0;
      const target = item.prescription.target_sets ?? 0;
      return target > 0 && completed >= target;
    });
  }, [exerciseProgress, workoutPlan?.exercises]);

  const canCompleteExercise = Boolean(hasStartedSession && activeExercise && isActiveExerciseComplete && !sessionComplete);
  const shouldEnableFooter = Boolean((allExercisesComplete && !sessionComplete) || canCompleteExercise);

  const buildNextTargetCue = (nextSet: number) => {
    if (!activeExercise) return null;
    const draft = setDrafts[nextSet] ?? { lbs: "", reps: "" };
    const reps = draft.reps.trim() || activeExercise.prescription.target_reps || "--";
    const load = draft.lbs.trim() ? ` @ ${draft.lbs.trim()} lbs` : "";
    return `Next: ${reps} reps${load}`;
  };

  useEffect(() => {
    if (remainingRestSec > 0) {
      setRestState((current) => (current === "started" ? "started" : "running"));
      return;
    }

    setRestState((current) => (current === "running" || current === "started" ? "complete" : "idle"));
  }, [remainingRestSec]);

  useEffect(() => {
    if (restState !== "started") return;
    const id = setTimeout(() => setRestState("running"), 700);
    return () => clearTimeout(id);
  }, [restState]);

  useEffect(() => {
    if (restState !== "complete") return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [restState]);

  const handleCompleteSet = async (setNumberOverride?: number) => {
    if (!sessionId || !activeExercise || disableCompleteSet) return;
    const setNumber = setNumberOverride ?? nextSetNumber;
    const draft = setDrafts[setNumber] ?? { lbs: "", reps: "" };
    const totalSets = targetSetsForActive;
    const willCompleteExercise = totalSets > 0 && setNumber >= totalSets;
    const hasNextExercise = Boolean(workoutPlan?.exercises?.[displayExerciseIndex + 1]);

    const repsCompleted = draft.reps.trim() ? Number(draft.reps) : repsForLog;
    const weightLbs = draft.lbs.trim() ? Number(draft.lbs) : NaN;
    const weightKg = Number.isFinite(weightLbs) ? lbsToKg(weightLbs) : null;

    try {
      await completeSetMutation.mutateAsync({
        exerciseLibraryId: activeExercise.exercise.id,
        repsCompleted: Number.isFinite(repsCompleted as number) ? (repsCompleted as number) : null,
        sessionId,
        setNumber,
        weightKg,
      });
      const restSeconds = activeExercise.prescription.rest_seconds ?? 90;
      if (restSeconds > 0) {
        await startRestTimer(restSeconds);
        setRestState("started");
      }
      setSetFeedback(`Set ${setNumber}/${totalSets || setNumber} complete`);
      setNextTargetCue(willCompleteExercise ? (hasNextExercise ? "Next: move to the next exercise" : "Next: finish workout") : buildNextTargetCue(setNumber + 1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      if (!willCompleteExercise) {
        setTimeout(() => {
          setInputRefs.current[setNumber + 1]?.focus();
        }, 150);
      } else if (hasNextExercise) {
        setHeldExerciseIndex(displayExerciseIndex);
        setTransitionLabel(`Next: ${workoutPlan?.exercises?.[displayExerciseIndex + 1]?.exercise.name ?? "Next exercise"}`);
        setTimeout(() => {
          setHeldExerciseIndex(null);
          setTransitionLabel(null);
          setSetFeedback(null);
          setNextTargetCue(null);
        }, 800);
      }
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "complete-set-action",
      });
      sessionQuery.refetch();
    }
  };

  const handleStartWorkout = async () => {
    if (startSessionMutation.isPending || sessionId) return;
    try {
      await startSession();
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "start-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
    }
  };

  const handleFinishWorkout = async () => {
    if (!sessionId || finishWorkoutMutation.isPending || sessionComplete || finishLockRef.current || completionSummary) return;
    finishLockRef.current = true;
    try {
      const isSignalWorkout = Boolean(isSignalExecution && signalWorkoutPayload && activeSignalProgram);
      const currentWeekLabel = workoutPlan?.week.title ?? signalWorkoutPayload?.weeks.find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)?.title ?? "Workout";
      const currentDayLabel = workoutPlan?.day.title ?? signalWorkoutPayload?.weeks
        .find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)
        ?.days.find((day) => day.id === signalDayId || day.sync_key === signalDayId)?.title ?? "Workout";
      const summarySnapshot: Omit<WorkoutCompletionSummary, "nextWorkout" | "progressUpdateNeedsRefresh" | "isProgramCompleted"> = {
        completedDayTitle: currentDayLabel,
        completedExercises: completedExerciseCount,
        completedSets: completedSetCount,
        completedWeekLabel: currentWeekLabel,
        programTitle: workoutPlan?.program.title ?? signalWorkoutPayload?.program.title ?? "Workout",
      };

      await finishWorkoutMutation.mutateAsync(sessionId);

      if (!isSignalWorkout) {
        await clearRestTimer();
        await new Promise((resolve) => setTimeout(resolve, 750));
        router.replace("/(tabs)");
        return;
      }

      const nextDay = signalWorkoutPayload
        ? findNextSignalWorkoutDay(signalWorkoutPayload, signalWeekId, signalDayId)
        : { error: "missing_program", isProgramCompleted: false, nextDayKey: null, nextWeekKey: null };
      let nextWorkout: WorkoutCompletionSummary["nextWorkout"] = null;
      let progressUpdateNeedsRefresh = false;

      if (nextDay.error) {
        progressUpdateNeedsRefresh = true;
        console.warn("[athlete-flow]", {
          error: nextDay.error,
          screen: "WorkoutPlayer",
          type: "active-program-advance-validation",
        });
      } else if (!nextDay.isProgramCompleted && nextDay.nextWeekKey && nextDay.nextDayKey && signalWorkoutPayload) {
        const nextWeek = signalWorkoutPayload.weeks.find((week) => week.id === nextDay.nextWeekKey || week.sync_key === nextDay.nextWeekKey);
        const nextDayRow = nextWeek?.days.find((day) => day.id === nextDay.nextDayKey || day.sync_key === nextDay.nextDayKey);
        if (!nextWeek || !nextDayRow) {
          progressUpdateNeedsRefresh = true;
        } else {
          nextWorkout = {
            dayId: nextDay.nextDayKey,
            dayLabel: nextDayRow.title,
            programId: signalWorkoutPayload.program.id,
            weekId: nextDay.nextWeekKey,
            weekLabel: nextWeek.title,
          };
        }
      }

      if (isSignalExecution && signalWorkoutPayload && activeSignalProgram) {
        if (!nextDay.error) {
          try {
            await advanceActiveProgramMutation.mutateAsync({
              activeProgramId: activeSignalProgram.id,
              completedSessionId: sessionId,
              isProgramCompleted: nextDay.isProgramCompleted,
              nextDayKey: nextDay.nextDayKey,
              nextWeekKey: nextDay.nextWeekKey,
            });
          } catch (error) {
            progressUpdateNeedsRefresh = true;
            console.warn("[athlete-flow]", {
              error: error instanceof Error ? error.message : String(error),
              screen: "WorkoutPlayer",
              type: "active-program-advance",
            });
          }
        }

        await clearRestTimer();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: nextDay.isProgramCompleted,
          nextWorkout,
          progressUpdateNeedsRefresh,
        });
        return;
      }

      await clearRestTimer();
      await new Promise((resolve) => setTimeout(resolve, 750));
      router.replace("/(tabs)");
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "finish-workout-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
      finishLockRef.current = false;
    }
  };

  const handleAdvanceExercise = () => {
    setHeldExerciseIndex(null);
    setTransitionLabel(null);
    setSetFeedback(null);
    setNextTargetCue(null);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleManualStartRest = async () => {
    if (!hasStartedSession || !activeExercise) return;
    const restSeconds = activeExercise.prescription.rest_seconds ?? 90;
    if (restSeconds > 0) {
      await startRestTimer(restSeconds);
      setRestState("started");
    }
  };

  const footerLabel = sessionComplete
    ? "Workout Completed"
    : allExercisesComplete
      ? "Finish Workout"
      : canCompleteExercise
        ? "Next Exercise"
        : "Complete Exercise";

  const footerAction = allExercisesComplete
    ? handleFinishWorkout
    : canCompleteExercise
      ? handleAdvanceExercise
      : () => {};

  return (
    <ScreenScaffold
      contentClassName="gap-gutter"
      header={
        <AppTopBar
          centered
          subtitle={(workoutPlan?.day.title ?? workoutPlan?.program.title ?? "Workout").toUpperCase()}
          taskMode
          title={
            workoutPlan?.exercises?.length
              ? `${displayExerciseIndex + 1} of ${workoutPlan.exercises.length} Exercises`
              : "Workout"
          }
        />
      }
      taskMode
      footer={
        hasStartedSession && !completionSummary ? (
          <View className="px-container pb-6">
            <AppButton
              disabled={!shouldEnableFooter}
              isLoading={finishWorkoutMutation.isPending}
              onPress={footerAction}
              size="lg"
              variant="primary"
            >
              {footerLabel}
            </AppButton>
          </View>
        ) : null
      }
    >
      <View className="gap-gutter px-container">
        {completionSummary ? (
          <EditorialCard className="gap-5 py-5">
          <View className="items-center gap-2">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
              <Ionicons color={colors.emerald} name="checkmark-circle" size={34} />
            </View>
            <Typography tone="secondary" variant="labelSm">
              Workout Complete
            </Typography>
            <Typography variant="headlineXl">{completionSummary.programTitle}</Typography>
          </View>

          <ProgressBar progress={1} tone="accent" className="h-2" />

          <View className="gap-2 rounded-2xl bg-surface-muted p-4">
            <Typography variant="headlineLg">{completionSummary.completedWeekLabel}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {completionSummary.completedDayTitle}
              </Typography>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Typography tone="secondary" variant="bodyMd">
                  Exercises completed
                </Typography>
                <Typography variant="headlineLg">{completionSummary.completedExercises}</Typography>
              </View>
              <View className="flex-row items-center justify-between">
                <Typography tone="secondary" variant="bodyMd">
                  Sets completed
                </Typography>
                <Typography variant="headlineLg">{completionSummary.completedSets}</Typography>
              </View>
            </View>

            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                {completionSummary.progressUpdateNeedsRefresh
                  ? "Workout saved, but progress update needs refresh"
                  : completionSummary.isProgramCompleted
                    ? "Program completed"
                    : "Next workout"}
              </Typography>
              <Typography variant="bodyMd">
                {completionSummary.progressUpdateNeedsRefresh
                  ? "Please return to the dashboard to refresh your active program state."
                  : completionSummary.isProgramCompleted
                    ? "You completed every playable workout in this program."
                    : completionSummary.nextWorkout
                      ? `${completionSummary.nextWorkout.weekLabel} · ${completionSummary.nextWorkout.dayLabel}`
                      : "Next workout unavailable."}
              </Typography>
            </View>

            <View className="gap-3 pt-2">
              {completionSummary.nextWorkout && !completionSummary.progressUpdateNeedsRefresh && !completionSummary.isProgramCompleted ? (
                <AppButton
                  onPress={() => {
                    router.push({
                      pathname: "/(signal)/program/[programId]/week/[weekId]/day/[dayId]",
                      params: {
                        dayId: completionSummary.nextWorkout?.dayId ?? "",
                        programId: completionSummary.nextWorkout?.programId ?? "",
                        weekId: completionSummary.nextWorkout?.weekId ?? "",
                      },
                    });
                  }}
                >
                  View Next Workout
                </AppButton>
              ) : null}
              <AppButton
                onPress={() => {
                  router.replace("/(tabs)");
                }}
                variant={completionSummary.nextWorkout && !completionSummary.progressUpdateNeedsRefresh && !completionSummary.isProgramCompleted ? "secondary" : "primary"}
              >
                Back to Dashboard
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {signalExecutionIssue ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">{signalExecutionIssue.title}</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {signalExecutionIssue.body}
            </Typography>
            {signalExecutionIssue.retry ? (
              <AppButton onPress={() => signalWorkoutQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            ) : null}
          </EditorialCard>
        ) : null}

        {hasError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load workout</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please try again in a moment.
            </Typography>
            <AppButton
              onPress={() => {
                enrollmentsQuery.refetch();
                workoutQuery.refetch();
                sessionQuery.refetch();
              }}
              variant="secondary"
            >
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {isLoading ? <WorkoutSkeleton /> : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !hasWorkoutAccess ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No active program</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Start a training protocol before opening workout execution.
            </Typography>
            <Link asChild href="/(marketplace)">
              <AppButton variant="secondary">Explore Programs</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !workoutPlan && !isSignalExecution ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No active workout today</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your active protocol does not have a recoverable plan for today. It may be unpublished or missing today’s training day.
            </Typography>
            <View className="gap-2">
              <AppButton
                onPress={() => {
                  workoutQuery.refetch();
                  enrollmentsQuery.refetch();
                }}
                variant="secondary"
              >
                Retry
              </AppButton>
              <Link asChild href="/(marketplace)">
                <AppButton variant="ghost">Browse Training</AppButton>
              </Link>
            </View>
          </EditorialCard>
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && workoutPlan && workoutPlan.exercises.length === 0 ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">No exercises for this day</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This training day has no programmed exercises yet.
          </Typography>
          <Link asChild href="/(marketplace)">
            <AppButton variant="secondary">Browse Training</AppButton>
          </Link>
        </EditorialCard>
      ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && workoutPlan && workoutPlan.exercises.length > 0 && !activeExercise ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Workout changed</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This exercise is no longer available in the current program. Reload the workout to recover.
          </Typography>
          <AppButton onPress={() => workoutQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && workoutPlan && workoutPlan.exercises.length > 0 && activeExercise ? (
        <View className="gap-gutter">
          <View className="aspect-[4/3] overflow-hidden rounded-3xl bg-surface-muted">
            <ImageBackground
              accessibilityLabel="Exercise demonstration"
              source={{
                uri:
                  activeExercise.exercise.video_url ??
                  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1200&auto=format&fit=crop",
              }}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <View className="flex-1 items-center justify-center bg-black/10">
                <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/80">
                  <Ionicons color={colors.graphite} name="play" size={30} />
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-2">
              <Chip label={activeExercise.exercise.primary_muscle ?? "Primary"} />
              <Chip label={formatDurationWeeks(workoutPlan.program.duration_weeks)} />
            </View>
            <Typography variant="displayLg">{activeExercise.exercise.name}</Typography>
            <Typography tone="secondary" variant="bodyLg">
              {activeExercise.prescription.notes ?? "Maintain control and execute each rep with intent."}
            </Typography>
          </View>

          <GlassCard className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-emerald">
                <Ionicons color={colors.emerald} name="timer-outline" size={22} />
              </View>
              <View>
                <Typography tone="secondary" variant="labelSm">
                  {restState === "complete" ? "Rest Complete" : restState === "started" ? "Rest Started" : restState === "running" ? "Rest Running" : "Rest Timer"}
                </Typography>
                <Typography variant="headlineXl">{restState === "complete" ? "Ready" : formatRest(remainingRestSec)}</Typography>
              </View>
            </View>
            {remainingRestSec > 0 ? (
              <AppButton onPress={() => clearRestTimer()} size="sm" variant="ghost">
                Skip Rest
              </AppButton>
            ) : (
              <AppButton
                disabled={!hasStartedSession}
                onPress={handleManualStartRest}
                size="sm"
                variant="secondary"
              >
                Start Rest
              </AppButton>
            )}
          </GlassCard>

          {(setFeedback || nextTargetCue || transitionLabel || restState === "complete") ? (
            <EditorialCard className="gap-1 py-4">
              <Typography variant="headlineLg">
                {transitionLabel ?? setFeedback ?? "Ready for next set"}
              </Typography>
              <Typography tone="secondary" variant="bodyMd">
                {transitionLabel ? "Exercise complete. Loading the next movement." : nextTargetCue ?? "Ready for next set"}
              </Typography>
            </EditorialCard>
          ) : null}

          {!hasStartedSession ? (
            <EditorialCard className="gap-3">
              <Typography variant="headlineLg">Ready to train</Typography>
              <Typography tone="secondary" variant="bodyMd">
                Start this workout when you are ready to log sets.
              </Typography>
              <AppButton
                isLoading={startSessionMutation.isPending}
                onPress={handleStartWorkout}
                variant="secondary"
              >
                Start Workout
              </AppButton>
            </EditorialCard>
          ) : null}

          <EditorialCard className="gap-3">
              <View className="flex-row items-end justify-between border-b border-border/50 pb-2">
                <Typography variant="headlineLg">Target Sets</Typography>
                <View className="flex-row items-center gap-6">
                  <Typography className="w-12 text-center uppercase tracking-widest" tone="secondary" variant="labelSm">
                    Lbs
                  </Typography>
                  <Typography className="w-12 text-center uppercase tracking-widest" tone="secondary" variant="labelSm">
                    Reps
                  </Typography>
                  <View className="w-8" />
                </View>
              </View>
              {!hasStartedSession ? (
                <Typography tone="secondary" variant="bodyMd">
                  Start workout to log sets.
                </Typography>
              ) : null}
              {Array.from({ length: Math.max(0, targetSetsForActive) }).map((_, index) => {
                const setNo = index + 1;
                const isActiveSet = hasStartedSession && setNo === nextSetNumber && !isActiveExerciseComplete;
                const completed = setNo <= completedSetsForActive;
                const draft = setDrafts[setNo] ?? { lbs: "", reps: "" };
                return (
                  <SetRowVariantD
                    completed={completed}
                    index={setNo}
                    isActive={isActiveSet}
                    key={setNo}
                    lbsValue={draft.lbs}
                    onChangeLbs={(next) =>
                      setSetDrafts((current) => ({
                        ...current,
                        [setNo]: { ...(current[setNo] ?? { lbs: "", reps: "" }), lbs: next },
                      }))
                    }
                    onChangeReps={(next) =>
                      setSetDrafts((current) => ({
                        ...current,
                        [setNo]: { ...(current[setNo] ?? { lbs: "", reps: "" }), reps: next },
                      }))
                    }
                    onToggleComplete={() => handleCompleteSet(setNo)}
                    repsValue={draft.reps}
                    setLabel={setNo === 1 ? "Warmup" : "Working"}
                    weightInputRef={(node) => {
                      setInputRefs.current[setNo] = node;
                    }}
                  />
                );
              })}

              <GlassCard className="border-dashed bg-transparent p-4">
                <AppButton
                  disabled
                  onPress={() => {}}
                  variant="ghost"
                >
                  + Add Set
                </AppButton>
              </GlassCard>
          </EditorialCard>
        </View>
      ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const WorkoutPlayerScreen = memo(WorkoutPlayerScreenComponent);
