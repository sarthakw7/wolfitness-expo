import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Link, router, useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Linking, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useAdvanceActiveProgramAfterWorkout, useCompleteSet, useFinishWorkout, useDiscardWorkoutSession } from "@/src/hooks/mutations";
import { useActiveProgram, useEnrollments, useWorkout, useWorkoutSession } from "@/src/hooks/queries";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useAuth } from "@/src/hooks/useAuth";
import { useRestTimer } from "@/src/hooks/useRestTimer";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { cn } from "@/src/lib/cn";
import { parseIndexParam, singleParam } from "@/src/lib/routing";
import { CoachMediaModal } from "@/src/features/workout/components/CoachMediaModal";
import { SignalWorkoutFooter } from "@/src/features/workout/components/SignalWorkoutFooter";
import { SignalWorkoutHeader } from "@/src/features/workout/components/SignalWorkoutHeader";
import { SignalWorkoutProgressHeader } from "@/src/features/workout/components/SignalWorkoutProgressHeader";
import { WorkoutExerciseHeader } from "@/src/features/workout/components/WorkoutExerciseHeader";
import { SIGNAL_SET_TABLE_COLUMNS, WorkoutSetRow } from "@/src/features/workout/components/WorkoutSetRow";
import { WorkoutCompletionSummary as WorkoutCompletionSummaryView } from "@/src/features/workout/components/WorkoutCompletionSummary";
import { useSignalSaveAndExit } from "@/src/features/workout/hooks/useSignalSaveAndExit";
import { useSignalWorkoutDerivedState } from "@/src/features/workout/hooks/useSignalWorkoutDerivedState";
import { useWorkoutPlayerDerivedState } from "@/src/features/workout/hooks/useWorkoutPlayerDerivedState";
import {
  buildSignalDemoSearchUrl,
  getSignalCoachMediaPreview,
  isValidHttpUrl,
  type SignalCoachMediaPreview,
} from "@/src/features/workout/lib/coachMedia";
import { normalizeCompletedSetPayload } from "@/src/features/workout/lib/normalizeCompletedSetPayload";
import { kgToLbs } from "@/src/features/workout/lib/weightConversion";
import {
  buildWorkoutLogKey,
  getWorkoutExerciseIdentityKey,
  getWorkoutLogIdentityKey,
} from "@/src/features/workout/lib/workoutLogIdentity";
import {
  formatSignalWorkoutPrescriptionSummary,
  getSignalPrescribedRepsValue,
  getSignalPrescribedRpeValue,
  getSignalPrescribedSetCount,
  getTargetSets,
} from "@/src/features/workout/lib/workoutPrescription";
import { formatSummaryLine } from "@/src/features/workout-summary/lib/formatWorkoutSummary";
import type { WorkoutSummary } from "@/src/features/workout-summary/types";
import {
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from "@/src/lib/youtube-media";
import type { WorkoutExercise } from "@/src/services/workout.service";
import {
  buildSignalWorkoutExecutionContext,
  buildSignalWorkoutSteps,
  formatSignalExercisePrescription,
  hasSignalWorkoutPayload,
  findNextSignalWorkoutDay,
  getSignalExerciseLabel,
  resolveSignalWorkoutInitialStepIndex,
  resolveSignalWorkoutSelection,
} from "@/src/services/signal-workout-adapter";
import { colors, spacing } from "@/src/theme";

const SIGNAL_WORKOUT_HOME_HREF = "/(tabs)/workouts" as const;

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
  summary: WorkoutSummary;
};

function isMatchingSignalActiveProgram(
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
      activeProgram.source_program_id === programId,
  );
}

function logSignalPointerMismatch(context: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[signal-workout-session]", "Active Signal program validation failed", context);
  }
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

const styles = StyleSheet.create({
  noteInputCompact: {
    borderRadius: 6,
    fontSize: 14,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteInput: {
    borderRadius: 6,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteInputSignal: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.white,
  },
});

function WorkoutPlayerScreenComponent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    signalBlockIndex?: string;
    signalExerciseIndex?: string;
    signalDayId?: string;
    signalProgramId?: string;
    signalStepType?: string;
    signalWeekId?: string;
  }>();
  const signalProgramId = singleParam(params.signalProgramId);
  const signalWeekId = singleParam(params.signalWeekId);
  const signalDayId = singleParam(params.signalDayId);
  const signalStepType = singleParam(params.signalStepType);
  const initialSignalBlockIndex = parseIndexParam(params.signalBlockIndex);
  const initialSignalExerciseIndex = parseIndexParam(params.signalExerciseIndex);
  const hasSignalRouteParams = Boolean(signalProgramId || signalWeekId || signalDayId);
  const isSignalExecution = hasSignalRouteParams;

  const enrollmentsQuery = useEnrollments();
  const activeProgramQuery = useActiveProgram(isSignalExecution ? user?.id : undefined);
  const activeProgram = activeProgramQuery.data ?? null;
  const workoutQuery = useWorkout({ enabled: !isSignalExecution });
  const signalProgramVersionId =
    isSignalExecution && activeProgram?.source === "signal" && activeProgram.source_program_id === signalProgramId
      ? activeProgram.source_program_version ?? null
      : null;
  const signalWorkoutQuery = useWorkoutProgram(signalProgramId, signalProgramVersionId);
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
  const signalOrderedSteps = useMemo(
    () => buildSignalWorkoutSteps(signalWorkoutSelection?.day ?? null),
    [signalWorkoutSelection?.day],
  );
  const signalInitialStepIndex = useMemo(
    () =>
      resolveSignalWorkoutInitialStepIndex(signalOrderedSteps, {
        blockIndex: initialSignalBlockIndex,
        exerciseIndex: initialSignalExerciseIndex,
        stepType: signalStepType,
      }),
    [initialSignalBlockIndex, initialSignalExerciseIndex, signalOrderedSteps, signalStepType],
  );
  const isActiveProgramLoading = isSignalExecution && activeProgramQuery.isLoading;
  const signalActiveProgramIsValid = isMatchingSignalActiveProgram(
    activeProgram,
    signalProgramId,
    signalWeekId,
    signalDayId,
  );
  useEffect(() => {
    if (!isSignalExecution || signalActiveProgramIsValid || !activeProgram) return;

    logSignalPointerMismatch({
      activeProgramId: activeProgram.id,
      activeProgramSourceProgramId: activeProgram.source_program_id,
      routeSignalProgramId: signalProgramId,
    });
  }, [
    activeProgram,
    isSignalExecution,
    signalActiveProgramIsValid,
    signalDayId,
    signalProgramId,
    signalWeekId,
  ]);
  useEffect(() => {
    if (__DEV__ && isSignalExecution && signalProgramVersionId == null) {
      console.warn("[SignalProgram] active program has no source_program_version; using latest fallback");
    }
  }, [isSignalExecution, signalProgramVersionId]);
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
  const signalSessionScope = useMemo(() => {
    if (!isSignalExecution || !activeSignalProgram || !signalProgramId || !signalWeekId || !signalDayId) return null;
    return {
      activeProgramId: activeSignalProgram.id,
      sourceDayKey: signalDayId,
      sourceProgramId: signalProgramId,
      sourceProgramVersion: signalProgramVersionId,
      sourceWeekKey: signalWeekId,
    };
  }, [
    activeSignalProgram,
    isSignalExecution,
    signalDayId,
    signalProgramId,
    signalProgramVersionId,
    signalWeekId,
  ]);
  const {
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
  } = useWorkoutSession(workoutPlan, signalSessionScope);

  const advanceActiveProgramMutation = useAdvanceActiveProgramAfterWorkout();
  const completeSetMutation = useCompleteSet();
  const finishWorkoutMutation = useFinishWorkout();
  const discardWorkoutMutation = useDiscardWorkoutSession();
  const setInputRefs = useRef<Record<string, TextInput | null>>({});
  const finishLockRef = useRef(false);
  const [completionSummary, setCompletionSummary] = useState<WorkoutCompletionSummary | null>(null);
  const [reflectionIntensity, setReflectionIntensity] = useState<number>(7);
  const [reflectionDurationMinutes, setReflectionDurationMinutes] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");
  const [shareWithCoachAndTeam, setShareWithCoachAndTeam] = useState<boolean>(false);
  const [signalFinishError, setSignalFinishError] = useState<string | null>(null);
  const [showRestTimerOptions, setShowRestTimerOptions] = useState(false);
  const [showCustomTimerInput, setShowCustomTimerInput] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState("");
  const signalCompletionSummary = isSignalExecution ? completionSummary : null;
  const [pendingCompletedSetKeys, setPendingCompletedSetKeys] = useState<Set<string>>(() => new Set());
  const restTimer = useRestTimer();
  const resetRestTimer = restTimer.reset;
  const isRestTimerCompleted = restTimer.isCompleted;
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
        body: "Your active Signal program does not match this published program.",
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

  const {
    activeExercise,
    completedExerciseCount,
    completedSetNumbersByExercise,
    normalizedLogs,
    workoutSummary,
  } = useWorkoutPlayerDerivedState({
    isSignalExecution,
    sessionData: sessionQuery.data,
    workoutPlan,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(signalInitialStepIndex);

  useEffect(() => {
    setCurrentStepIndex(signalInitialStepIndex);
    setSetDrafts({});
    setExerciseNotes({});
    setExtraSetsByExercise({});
    setCompletionSummary(null);
    setReflectionIntensity(7);
    setReflectionDurationMinutes("");
    setReflectionNote("");
    setShareWithCoachAndTeam(false);
    setSignalFinishError(null);
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    setCustomTimerInput("");
    setPendingCompletedSetKeys(new Set());
    resetRestTimer();
  }, [resetRestTimer, signalDayId, signalInitialStepIndex, signalWeekId]);

  useEffect(() => {
    if (!isRestTimerCompleted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [isRestTimerCompleted]);

  const {
    canGoToPreviousSignalStep,
    currentStep,
    currentStepBody,
    currentStepLabel,
    currentStepTitle,
    isCoachInstructionsStep,
    isDoneTrainingStep,
    isExerciseBlockStep,
    isInstructionBlockStep,
    isReflectionStep,
    isSummaryStep,
    isWorkoutProgressStep,
    safeStepIndex,
    signalProgressIndex,
    signalProgressSteps,
    signalStepCount,
    signalStepProgress,
    signalWorkoutBlockCount,
    signalWorkoutStepLines,
  } = useSignalWorkoutDerivedState({
    currentStepIndex,
    isSignalExecution,
    signalOrderedSteps,
  });

  const sessionComplete = Boolean(sessionQuery.data?.session.completed_at);
  const hasStartedSession = Boolean(sessionId && sessionQuery.data?.session.cancelled_at === null);
  
  if (__DEV__) {
    console.log("[WorkoutSessionDebug] useWorkoutSession state", {
      dayId: workoutPlan?.day.id,
      programId: workoutPlan?.program.id,
      versionId: activeProgram?.source_program_version,
      sessionId,
      hasData: Boolean(sessionQuery.data),
      isFetching: sessionQuery.isFetching
    });
  }
  const [setDrafts, setSetDrafts] = useState<Record<string, { lbs: string; reps: string; rpe: string }>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [extraSetsByExercise, setExtraSetsByExercise] = useState<Record<string, number>>({});
  const [activeCoachMedia, setActiveCoachMedia] = useState<SignalCoachMediaPreview | null>(null);
  const [coachMediaError, setCoachMediaError] = useState(false);
  const { isSavingAndExiting, saveAndExit: handleSaveAndExit } = useSignalSaveAndExit({
    completedSetNumbersByExercise,
    completeSetMutationIsPending: completeSetMutation.isPending,
    drafts: setDrafts,
    extraSetsByExercise,
    isSignalExecution,
    navigateHome: () => {
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
    },
    pendingCompletedSetKeys,
    queryClient,
    refetchSession: sessionQuery.refetch,
    refetchWorkout: workoutQuery.refetch,
    resetRestTimer,
    sessionId,
    signalSessionScope,
    userId: user?.id,
    workoutPlan,
  });
  const isWorkoutPersistenceBusy =
    completeSetMutation.isPending || pendingCompletedSetKeys.size > 0 || isSavingAndExiting;

  useEffect(() => {
    setSetDrafts({});
  }, [sessionId, signalDayId, signalWeekId]);

  useEffect(() => {
    setActiveCoachMedia(null);
    setCoachMediaError(false);
  }, [signalDayId, signalWeekId]);

  useEffect(() => {
    if (!normalizedLogs.length) return;

    setSetDrafts((current) => {
      const next = { ...current };
      normalizedLogs.forEach((log) => {
        const draftKey = buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number);
        if (next[draftKey]) return;
        next[draftKey] = {
          lbs: log.weight_kg != null ? String(Math.round(kgToLbs(Number(log.weight_kg)))) : "",
          reps: log.reps_completed != null ? String(log.reps_completed) : "",
          rpe: log.rpe_actual != null ? String(log.rpe_actual) : "",
        };
      });
      return next;
    });
  }, [normalizedLogs]);

  useEffect(() => {
    if (!workoutPlan?.exercises?.length || !normalizedLogs.length) return;

    setExtraSetsByExercise((current) => {
      const next = { ...current };
      let changed = false;

      workoutPlan.exercises.forEach((exercise) => {
        const exerciseId = getWorkoutExerciseIdentityKey(exercise);
        const targetSets = getTargetSets(exercise);
        const inferredExtraSets = normalizedLogs.reduce((max, log) => {
          if (getWorkoutLogIdentityKey(log) !== exerciseId) return max;
          return Math.max(max, log.set_number - targetSets);
        }, 0);
        const currentExtraSets = next[exerciseId] ?? 0;
        if (inferredExtraSets > currentExtraSets) {
          next[exerciseId] = inferredExtraSets;
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [normalizedLogs, workoutPlan?.exercises]);

  useEffect(() => {
    if (pendingCompletedSetKeys.size === 0) return;

    setPendingCompletedSetKeys((current) => {
      const next = new Set(current);
      normalizedLogs.forEach((log) => {
        next.delete(buildWorkoutLogKey(getWorkoutLogIdentityKey(log), log.set_number));
      });
      return next.size === current.size ? current : next;
    });
  }, [normalizedLogs, pendingCompletedSetKeys.size]);

  const signalStepPrimaryLabel = isCoachInstructionsStep
    ? "Got It"
    : isInstructionBlockStep
      ? "Complete"
      : isExerciseBlockStep
        ? hasStartedSession
          ? "Next"
          : "Begin Logging"
        : isDoneTrainingStep
          ? "Continue"
          : "Next";
  const signalRightActionLabel = isCoachInstructionsStep
    ? "Got It"
    : isInstructionBlockStep
      ? "Complete"
      : isExerciseBlockStep
        ? "Next"
        : signalStepPrimaryLabel;
  const signalCenterActionLabel = !hasStartedSession
    ? "Begin Logging"
    : restTimer.isRunning && restTimer.formattedRemaining
      ? `Rest ${restTimer.formattedRemaining}`
      : restTimer.isPaused && restTimer.formattedRemaining
        ? `Paused ${restTimer.formattedRemaining}`
        : restTimer.isCompleted
          ? "Rest Done"
          : "Select Timer";
  const currentSignalBlockExercises = useMemo(() => {
    if (!isSignalExecution || currentStep?.type !== "exercise_block" || !workoutPlan || !currentStep.block || !currentStep.blockLabel) {
      return [];
    }
    const blockLabel = currentStep.blockLabel;

    return currentStep.block.exercises.map((payloadExercise, exerciseIndex) => {
      const workoutExercise =
        workoutPlan.exercises.find(
          (exercise) =>
            exercise.prescription.id === payloadExercise.id ||
            exercise.source_exercise_key === payloadExercise.sync_key ||
            exercise.exercise.id === payloadExercise.exerciseId,
        ) ?? null;
      const exerciseId = workoutExercise ? getWorkoutExerciseIdentityKey(workoutExercise) : payloadExercise.sync_key;
      const completedSetNumbers = completedSetNumbersByExercise.get(exerciseId) ?? new Set<number>();
      const targetSets = Math.max(1, getSignalPrescribedSetCount(workoutExercise, payloadExercise));
      const prescribedReps = getSignalPrescribedRepsValue(workoutExercise, payloadExercise);
      const prescribedRpe = getSignalPrescribedRpeValue(workoutExercise, payloadExercise);
      let nextSetNumber = targetSets;
      for (let setNumber = 1; setNumber <= targetSets; setNumber += 1) {
        if (!completedSetNumbers.has(setNumber)) {
          nextSetNumber = setNumber;
          break;
        }
      }
      const coachMedia = getSignalCoachMediaPreview(workoutExercise, payloadExercise.exerciseName);
      const mediaUrl = coachMedia?.url && isValidHttpUrl(coachMedia.url) ? coachMedia.url : null;

      if (__DEV__) {
        console.log("[PlayerPrescription] exercise", {
          name: payloadExercise.exerciseName,
          reps: payloadExercise.reps,
          rest: payloadExercise.rest,
          rpe: payloadExercise.rpe,
          sets: payloadExercise.sets,
        });
        console.log("[PlayerSetRows]", {
          name: payloadExercise.exerciseName,
          prescribedSets: targetSets,
          rows: targetSets,
        });
      }

      return {
        completedSetNumbers,
        coachMedia,
        exerciseId,
        exerciseIndex,
        label: getSignalExerciseLabel(blockLabel, exerciseIndex),
        note: exerciseNotes[exerciseId] ?? "",
        payloadExercise,
        targetSets,
        nextSetNumber,
        workoutExercise,
        demoLabel: mediaUrl ? "View Demo" : "Search Demo",
        demoThumbnailUrl: coachMedia?.thumbnailUrl ?? null,
        demoTitle: coachMedia?.title ?? payloadExercise.exerciseName,
        demoUrl: mediaUrl ?? buildSignalDemoSearchUrl(payloadExercise.exerciseName),
        demoVideoId: coachMedia?.videoId ?? null,
        prescribedReps,
        prescribedRpe,
        extraSets: extraSetsByExercise[exerciseId] ?? 0,
      };
    });
  }, [
    completedSetNumbersByExercise,
    currentStep,
    exerciseNotes,
    extraSetsByExercise,
    isSignalExecution,
    workoutPlan,
  ]);
  const shouldEnableFooter =
    Boolean(sessionId) && !finishWorkoutMutation.isPending && !sessionComplete && !finishLockRef.current && !completionSummary;
  const footerLabel = finishWorkoutMutation.isPending ? "Finishing..." : "Finish Workout";
  const footerAction = handleFinishWorkout;

  useEffect(() => {
    if (!__DEV__ || !isSignalExecution) return;
    console.log("[signal-ordered-steps]", {
      currentStepIndex: safeStepIndex,
      initialStepIndex: signalInitialStepIndex,
      steps: signalWorkoutStepLines,
      totalSteps: signalOrderedSteps.length,
    });

    if (signalWorkoutBlockCount <= 1) {
      console.warn(
        "Signal demo program only has one block. To test A/B/C/D/E flow, create/publish a Signal day with multiple blocks.",
      );
    }
  }, [
    isSignalExecution,
    safeStepIndex,
    signalInitialStepIndex,
    signalOrderedSteps.length,
    signalWorkoutBlockCount,
    signalWorkoutStepLines,
  ]);

  const handleCompleteSet = async (exercise: WorkoutExercise, setNumber: number) => {
    if (!sessionId || completeSetMutation.isPending || sessionComplete) return;
    const exerciseIdentityKey = getWorkoutExerciseIdentityKey(exercise);
    const completedSetNumbers = completedSetNumbersByExercise.get(exerciseIdentityKey) ?? new Set<number>();
    const targetSets = getTargetSets(exercise);
    const isExerciseComplete = targetSets > 0 && completedSetNumbers.size >= targetSets;
    const logKey = buildWorkoutLogKey(exerciseIdentityKey, setNumber);
    if (isExerciseComplete || completedSetNumbers.has(setNumber) || pendingCompletedSetKeys.has(logKey)) {
      return;
    }
    const draft = setDrafts[logKey] ?? { lbs: "", reps: "", rpe: "" };
    const totalSets = targetSets;
    const willCompleteExercise = totalSets > 0 && setNumber >= totalSets;
    const normalized = normalizeCompletedSetPayload({ draft, exercise, isSignalWorkout: isSignalExecution, setNumber });
    const payload = {
      exerciseLibraryId: normalized.exerciseLibraryId,
      exerciseName: normalized.exerciseName,
      repsCompleted: normalized.repsCompleted,
      rpeActual: normalized.rpeActual,
      sessionId,
      setNumber: normalized.setNumber,
      sourceExerciseKey: normalized.sourceExerciseKey,
      weightKg: normalized.weightKg,
    };

    if (__DEV__ && isSignalExecution) {
      console.log("[CompleteSet] draft", draft);
      console.log("[CompleteSet] payload", payload);
        console.log("[signal-workout-player]", {
          activeExerciseId: exerciseIdentityKey,
          activeExerciseName: exercise.exercise.name,
          completedSetCount: completedSetNumbers.size,
          nextSetNumber: setNumber,
        repsCompleted: normalized.repsCompleted,
        rpeActual: normalized.rpeActual,
        sessionId,
        weightKg: normalized.weightKg,
      });
    }

    try {
      setPendingCompletedSetKeys((current) => {
        const next = new Set(current);
        next.add(logKey);
        return next;
      });
      const result = await completeSetMutation.mutateAsync(payload);
      if (__DEV__ && isSignalExecution) {
        console.log("[CompleteSet] success", result);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      if (!willCompleteExercise) {
        setTimeout(() => {
          setInputRefs.current[buildWorkoutLogKey(exerciseIdentityKey, setNumber + 1)]?.focus();
        }, 150);
      }
    } catch (error) {
      if (__DEV__ && isSignalExecution) {
        console.log("[CompleteSet] error", {
          error: error instanceof Error ? error.message : String(error),
          sessionId,
        });
      }
      setPendingCompletedSetKeys((current) => {
        const next = new Set(current);
        next.delete(logKey);
        return next;
      });
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "complete-set-action",
      });
      sessionQuery.refetch();
    }
  };

  const handleSignalStepBack = () => {
    if (!isSignalExecution) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    if (safeStepIndex > 0) {
      setCurrentStepIndex((current) => Math.max(0, current - 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    restTimer.reset();
    router.replace(SIGNAL_WORKOUT_HOME_HREF);
  };

  const handleSignalHeaderNext = async () => {
    if (!isSignalExecution || !currentStep) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);

    if (isSummaryStep) {
      await handleSignalSummaryDone();
      return;
    }

    if (isReflectionStep && !completionSummary) {
      return;
    }

    setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleOpenCoachMedia = (preview: SignalCoachMediaPreview) => {
    setCoachMediaError(false);
    setActiveCoachMedia(preview);
  };

  const handleCloseCoachMedia = () => {
    setActiveCoachMedia(null);
    setCoachMediaError(false);
  };

  const coachMediaModalNode = activeCoachMedia ? (
    <CoachMediaModal
      embedUrl={activeCoachMedia.videoId ? buildYouTubeEmbedUrl(activeCoachMedia.videoId) : null}
      hasPlaybackError={coachMediaError}
      onClose={handleCloseCoachMedia}
      onOpenOriginalVideo={() => {
        const fallbackUrl = activeCoachMedia.url ?? (activeCoachMedia.videoId ? buildYouTubeWatchUrl(activeCoachMedia.videoId) : null);
        if (fallbackUrl) {
          Linking.openURL(fallbackUrl).catch(() => {});
        }
      }}
      onPlaybackError={() => setCoachMediaError(true)}
      paddingTop={insets.top + spacing[4]}
      title={activeCoachMedia.title}
    />
  ) : null;

  const signalHeaderNode = isSignalExecution ? (
    <SignalWorkoutHeader
      currentStepTitle={currentStepTitle ?? workoutPlan?.day.title ?? "Workout"}
      hasStartedSession={hasStartedSession}
      isWorkoutPersistenceBusy={isWorkoutPersistenceBusy}
      onClose={() => {
        if (isWorkoutPersistenceBusy) return;
        if (hasStartedSession) {
          console.log("[WorkoutPlayer] exit requested", { hasStartedSession, sessionId });
          Alert.alert(
            "Leave workout?",
            "Your progress is saved. You can resume this workout later.",
            [
              { text: "Continue Workout", style: "cancel" },
              {
                text: "Discard Session",
                style: "destructive",
                onPress: () => {
                  console.log("[WorkoutPlayer] discard session requested", { sessionId });
                  Alert.alert(
                    "Discard session?",
                    "This will delete this in-progress workout session and any sets logged in it. This cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Discard",
                        style: "destructive",
                        onPress: () => handleDiscardSession(),
                      },
                    ],
                  );
                },
              },
              {
                text: "Save & Exit",
                style: "default",
                onPress: () => {
                  console.log("[WorkoutPlayer] save and exit", { sessionId });
                  void handleSaveAndExit();
                },
              },
            ],
          );
        } else {
          console.log("[WorkoutPlayer] exit requested", { hasStartedSession, sessionId });
          restTimer.reset();
          router.replace(SIGNAL_WORKOUT_HOME_HREF);
        }
      }}
      onFinishEarly={
        hasStartedSession && !isSummaryStep && !isReflectionStep && !isDoneTrainingStep
          ? () => {
              console.log("[WorkoutPlayer] finish early requested", { sessionId });
              Alert.alert(
                "Finish workout early?",
                "This will save your logged sets and take you to reflection.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Finish Early",
                    style: "destructive",
                    onPress: () => {
                      const reflectionStepIndex = signalOrderedSteps.findIndex((step) => step.type === "reflection");
                      if (reflectionStepIndex >= 0) {
                        setCurrentStepIndex(reflectionStepIndex);
                      }
                    },
                  },
                ],
              );
            }
          : null
      }
      onNext={handleSignalHeaderNext}
      paddingTop={insets.top + spacing[1]}
      stepCount={signalStepCount}
      stepIndex={safeStepIndex}
    />
  ) : null;

  const handleSignalStepPrimary = async () => {
    if (!isSignalExecution || !currentStep) return;
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);

    if (isCoachInstructionsStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isInstructionBlockStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isExerciseBlockStep) {
      setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
      Haptics.selectionAsync().catch(() => {});
      return;
    }

    if (isDoneTrainingStep) {
      const reflectionStepIndex = signalOrderedSteps.findIndex((step) => step.type === "reflection");
      if (reflectionStepIndex >= 0) {
        setCurrentStepIndex(reflectionStepIndex);
        Haptics.selectionAsync().catch(() => {});
      }
      return;
    }

    if (isSummaryStep) {
      await handleSignalSummaryDone();
      return;
    }

    setCurrentStepIndex((current) => Math.min(signalOrderedSteps.length - 1, current + 1));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSignalFooterCenterPress = async () => {
    if (!isSignalExecution || !isWorkoutProgressStep) return;

    if (!hasStartedSession) {
      console.log("[WorkoutPlayer] begin logging pressed", { sessionId });
      await handleStartWorkout();
      return;
    }

    setShowRestTimerOptions((current) => !current);
    setShowCustomTimerInput(false);
  };

  const handleSignalTimerSelect = (seconds: number) => {
    restTimer.start(seconds);
    setShowRestTimerOptions(false);
    setShowCustomTimerInput(false);
    setCustomTimerInput("");
  };

  const handleSignalSummaryDone = async () => {
    if (!isSignalExecution || !currentStep) return;

    if (!completionSummary) {
      await handleFinishWorkout();
      return;
    }

    restTimer.reset();
    router.replace(SIGNAL_WORKOUT_HOME_HREF);
  };

  const handleStartCustomTimer = () => {
    const parsed = Number.parseInt(customTimerInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 5 || parsed > 60 * 30) return;
    restTimer.setCustomDuration(parsed);
    restTimer.start(parsed);
    setShowCustomTimerInput(false);
    setShowRestTimerOptions(false);
    setCustomTimerInput("");
  };

  const handleStartWorkout = async () => {
    if (startSessionMutation.isPending || sessionId) return false;
    try {
      await startSession();
      return true;
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
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "start-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
      return false;
    }
  };

  async function handleFinishWorkout() {
    if (!sessionId || finishWorkoutMutation.isPending || sessionComplete || finishLockRef.current || completionSummary) return;
    setSignalFinishError(null);
    finishLockRef.current = true;
    try {
      const isSignalWorkout = Boolean(isSignalExecution && signalWorkoutPayload && activeSignalProgram);
      const currentWeekLabel = workoutPlan?.week.title ?? signalWorkoutPayload?.weeks.find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)?.title ?? "Workout";
      const currentDayLabel = workoutPlan?.day.title ?? signalWorkoutPayload?.weeks
        .find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)
        ?.days.find((day) => day.id === signalDayId || day.sync_key === signalDayId)?.title ?? "Workout";
      const summary = workoutSummary ?? {
        averageRpe: null,
        completedAt: new Date().toISOString(),
        durationMinutes: null,
        notes: null,
        startedAt: sessionQuery.data?.session.started_at ?? new Date().toISOString(),
        totalExercises: completedExerciseCount,
        totalReps: normalizedLogs.reduce((total, log) => total + (log.reps_completed ?? 0), 0),
        totalSets: normalizedLogs.length,
        totalVolumeKg: normalizedLogs.reduce((total, log) => {
          const reps = log.reps_completed ?? 0;
          const weightKg = log.weight_kg ?? 0;
          return total + reps * weightKg;
        }, 0),
        totalWeightMovedKg: normalizedLogs.reduce((total, log) => {
          const reps = log.reps_completed ?? 0;
          const weightKg = log.weight_kg ?? 0;
          return total + reps * weightKg;
        }, 0),
      };
      const summarySnapshot: Omit<WorkoutCompletionSummary, "nextWorkout" | "progressUpdateNeedsRefresh" | "isProgramCompleted"> = {
        completedDayTitle: currentDayLabel,
        completedExercises: summary.totalExercises,
        completedSets: summary.totalSets,
        completedWeekLabel: currentWeekLabel,
        programTitle: workoutPlan?.program.title ?? signalWorkoutPayload?.program.title ?? "Workout",
        summary,
      };

      await finishWorkoutMutation.mutateAsync(sessionId);

      if (!isSignalWorkout) {
        restTimer.reset();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: false,
          nextWorkout: null,
          progressUpdateNeedsRefresh: false,
        });
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

        restTimer.reset();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: nextDay.isProgramCompleted,
          nextWorkout,
          progressUpdateNeedsRefresh,
        });
        const summaryStepIndex = signalOrderedSteps.findIndex((step) => step.type === "summary");
        if (summaryStepIndex >= 0) {
          setCurrentStepIndex(summaryStepIndex);
        }
        return;
      }

      restTimer.reset();
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
      setSignalFinishError(error instanceof Error ? error.message : "Unable to finish workout.");
      finishLockRef.current = false;
    }
  }

  async function handleDiscardSession() {
    if (!sessionId || discardWorkoutMutation.isPending || finishLockRef.current) return;
    try {
      console.log("[DiscardDebug] before discard", {
        sessionId,
        hasStartedSession,
        routeParams: params,
      });

      console.log("[DiscardDebug] service deleting", { sessionId });
      const result = await discardWorkoutMutation.mutateAsync({
        sessionId,
        signalScope: signalSessionScope,
      });
      console.log("[DiscardDebug] after service discard", { sessionId });

      console.log("[DiscardDebug] discard result handled in UI", {
        status: result.status,
        sessionId
      });

      const resetKeys = [queryKeys.workoutSession(sessionId), queryKeys.workoutSessionPlans(), queryKeys.workoutSessionStatuses()] as const;
      const signalResetKeys = signalSessionScope
        ? [
            queryKeys.signalWorkoutSession(
              user?.id ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionPlan(
              user?.id ?? "",
              signalSessionScope.activeProgramId,
              signalSessionScope.sourceProgramId,
              signalSessionScope.sourceProgramVersion,
              signalSessionScope.sourceWeekKey,
              signalSessionScope.sourceDayKey,
            ),
            queryKeys.signalWorkoutSessionStatus(
              user?.id ?? "",
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
      if (user?.id) {
        resetPromises.push(queryClient.resetQueries({ queryKey: queryKeys.workoutActiveSession(user.id) }));
      }
      await Promise.all(resetPromises);

      setExtraSetsByExercise({});
      setPendingCompletedSetKeys(new Set());
      setSetDrafts({});
      restTimer.reset();

      console.log("[DiscardDebug] after local reset", {
        sessionId,
        hasStartedSession: Boolean(sessionQuery.data?.session?.id)
      });

      console.log("[DiscardDebug] replacing to workout home");
      router.setParams({
        signalDayId: "",
        signalProgramId: "",
        signalWeekId: "",
        signalStepType: "",
        signalBlockIndex: "",
      });
      console.log("[SessionAudit][discard]", {
        queriesReset: true,
        routeParamsCleared: true,
        sessionId,
        status: result.status,
      });
      router.replace(SIGNAL_WORKOUT_HOME_HREF);
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "discard-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
    }
  }

  const showSignalFooter =
    isSignalExecution && !isLoading && !hasError && !signalExecutionIssue && Boolean(workoutPlan) && Boolean(currentStep);
  const signalFooter = showSignalFooter ? (
    <SignalWorkoutFooter
      canGoBack={canGoToPreviousSignalStep}
      centerActionLabel={signalCenterActionLabel}
      customTimerInput={customTimerInput}
      finishPending={finishWorkoutMutation.isPending}
      hasStartedSession={hasStartedSession}
      isDoneTrainingStep={isDoneTrainingStep}
      isReflectionStep={isReflectionStep}
      isSummaryStep={isSummaryStep}
      isWorkoutProgressStep={isWorkoutProgressStep}
      onBack={handleSignalStepBack}
      onCancelCustomTimer={() => {
        setShowCustomTimerInput(false);
        setCustomTimerInput("");
      }}
      onCancelTimerPanel={() => {
        setShowCustomTimerInput(false);
        setShowRestTimerOptions(false);
      }}
      onCenterAction={handleSignalFooterCenterPress}
      onChangeCustomTimerInput={setCustomTimerInput}
      onFinishSession={handleFinishWorkout}
      onPauseOrResumeTimer={() => {
        if (restTimer.isRunning) {
          restTimer.pause();
        } else if (restTimer.isPaused) {
          restTimer.resume();
        }
        setShowRestTimerOptions(false);
      }}
      onPrimaryAction={handleSignalStepPrimary}
      onStartCustomTimer={handleStartCustomTimer}
      onStartTimer={handleSignalTimerSelect}
      onStepDone={() => {
        void handleSignalSummaryDone();
      }}
      onTimerAdd30={() => restTimer.addSeconds(30)}
      onTimerStop={() => {
        restTimer.stop();
        setShowRestTimerOptions(false);
      }}
      onTimerSubtract30={() => restTimer.subtractSeconds(30)}
      rightActionLabel={signalRightActionLabel}
      showCustomTimerInput={showCustomTimerInput}
      showRestTimerOptions={showRestTimerOptions}
      startSessionPending={startSessionMutation.isPending}
      timerIsCompleted={restTimer.isCompleted}
      timerIsIdle={restTimer.isIdle}
      timerIsPaused={restTimer.isPaused}
    />
  ) : null;

  return (
    <>
    <ScreenScaffold
      backgroundClassName={isSignalExecution ? "bg-graphite" : undefined}
      backgroundColor={isSignalExecution ? colors.graphite : undefined}
      bottomChrome={isSignalExecution ? "none" : "tabs"}
      contentClassName={cn("gap-gutter", isSignalExecution ? "pb-32" : null)}
      footerClassName={isSignalExecution ? "border-t border-white/10 bg-[#0f1316]/96" : undefined}
      footerMode={isSignalExecution ? "docked" : "default"}
      header={
        isSignalExecution ? signalHeaderNode : (
          <AppTopBar
            centered
            subtitle={(workoutPlan?.program.title ?? "Workout").toUpperCase()}
            taskMode
            title={workoutPlan?.day.title ?? workoutPlan?.program.title ?? "Workout"}
          />
        )
      }
      taskMode
      footer={
        showSignalFooter ? (
          <View className="px-0 pt-0.5">
            {signalFooter}
          </View>
        ) : hasStartedSession && !completionSummary && !isSignalExecution ? (
          <View
            className={cn(
              "border-t px-container pb-6 pt-4",
              isSignalExecution ? "border-white/10 bg-graphite/95" : "border-border bg-surface",
            )}
          >
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
        {completionSummary && !isSignalExecution ? (
          <WorkoutCompletionSummaryView
            completedDayTitle={completionSummary.completedDayTitle}
            completedWeekLabel={completionSummary.completedWeekLabel}
            isProgramCompleted={completionSummary.isProgramCompleted}
            nextWorkout={completionSummary.nextWorkout}
            onBackToDashboard={() => {
              router.replace("/(tabs)");
            }}
            onViewNextWorkout={
              completionSummary.nextWorkout
                ? () => {
                    router.push({
                      pathname: "/(signal)/program/[programId]/week/[weekId]/day/[dayId]",
                      params: {
                        dayId: completionSummary.nextWorkout?.dayId ?? "",
                        programId: completionSummary.nextWorkout?.programId ?? "",
                        weekId: completionSummary.nextWorkout?.weekId ?? "",
                      },
                    });
                  }
                : null
            }
            progressUpdateNeedsRefresh={completionSummary.progressUpdateNeedsRefresh}
            programTitle={completionSummary.programTitle}
            summary={completionSummary.summary}
          />
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

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && !isSignalExecution && workoutPlan && workoutPlan.exercises.length === 0 ? (
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

        {!completionSummary &&
        !isLoading &&
        !hasError &&
        !signalExecutionIssue &&
        workoutPlan &&
        workoutPlan.exercises.length > 0 &&
        !activeExercise &&
        !isSignalExecution ? (
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

        {!isLoading && !hasError && !signalExecutionIssue && isSignalExecution && signalCompletionSummary ? (
          <WorkoutCompletionSummaryView
            completedDayTitle={signalCompletionSummary.completedDayTitle}
            completedWeekLabel={signalCompletionSummary.completedWeekLabel}
            isProgramCompleted={signalCompletionSummary.isProgramCompleted}
            nextWorkout={signalCompletionSummary.nextWorkout}
            onBackToDashboard={() => {
              router.replace("/(tabs)");
            }}
            onViewNextWorkout={null}
            progressUpdateNeedsRefresh={signalCompletionSummary.progressUpdateNeedsRefresh}
            programTitle={signalCompletionSummary.programTitle}
            signalMode
            summary={signalCompletionSummary.summary}
          />
        ) : null}

        {!completionSummary && !isLoading && !hasError && !signalExecutionIssue && isSignalExecution && workoutPlan && currentStep ? (
            <View className="gap-4">
              <SignalWorkoutProgressHeader
                progress={signalStepProgress}
                progressIndex={signalProgressIndex}
                stepLabel={currentStepLabel ?? "STEP"}
                steps={signalProgressSteps}
                summaryLabel={workoutSummary ? formatSummaryLine(workoutSummary) : "Workout in progress"}
              />

            <View className="gap-4 rounded-md border border-white/10 bg-[#101417] p-4">
              <View className="gap-1.5">
                <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                  {isCoachInstructionsStep ? "COACH INSTRUCTIONS" : isExerciseBlockStep ? "EXERCISE BLOCK" : isInstructionBlockStep ? "BLOCK" : "STEP"}
                </Typography>
                <Typography tone="inverse" variant="headlineLg">
                  {`${currentStepLabel ?? ""} ${currentStepTitle ?? "Workout"}`.trim()}
                </Typography>
                {isExerciseBlockStep ? (
                  <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                    Scroll through the full block and log each exercise below.
                  </Typography>
                ) : null}
                {!isExerciseBlockStep && currentStepBody ? (
                  <Typography className="opacity-85" tone="inverse" variant="bodyMd">
                    {currentStepBody}
                  </Typography>
                ) : null}
              </View>

              {isCoachInstructionsStep ? (
                <Typography className="opacity-75" tone="inverse" variant="bodyMd">
                  Read the coaching notes, then continue.
                </Typography>
              ) : null}

              {isInstructionBlockStep ? (
                <Typography className="opacity-75" tone="inverse" variant="bodyMd">
                  Review the block details, then continue.
                </Typography>
              ) : null}

              {isExerciseBlockStep ? (
                <View className="gap-4">
                  {!hasStartedSession ? (
                    <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                      Start session to begin logging.
                    </Typography>
                  ) : null}

                  {currentSignalBlockExercises.map((exerciseSection) => (
                    <View className="gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3.5" key={exerciseSection.payloadExercise.sync_key}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Typography tone="inverse" variant="bodyLg">
                            {exerciseSection.label} {exerciseSection.payloadExercise.exerciseName}
                          </Typography>
                          <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                            {exerciseSection.workoutExercise
                              ? formatSignalWorkoutPrescriptionSummary(exerciseSection.workoutExercise.prescription) ??
                                formatSignalExercisePrescription(exerciseSection.payloadExercise) ??
                                "Log the prescribed sets below."
                              : formatSignalExercisePrescription(exerciseSection.payloadExercise) ?? "Log the prescribed sets below."}
                          </Typography>
                          {exerciseSection.workoutExercise?.prescription.notes ? (
                            <Typography className="opacity-72" tone="inverse" variant="bodyMd">
                              {exerciseSection.workoutExercise.prescription.notes}
                            </Typography>
                          ) : null}
                          {!exerciseSection.workoutExercise?.prescription.notes && exerciseSection.payloadExercise.notes?.trim() ? (
                            <Typography className="opacity-72" tone="inverse" variant="bodyMd">
                              {exerciseSection.payloadExercise.notes.trim()}
                            </Typography>
                          ) : null}
                        </View>
                      </View>

                      {exerciseSection.demoVideoId ? (
                        <Pressable
                          accessibilityRole="button"
                          className="overflow-hidden rounded-lg border border-white/12 bg-white/[0.04]"
                          onPress={() => {
                            if (exerciseSection.demoVideoId) {
                              handleOpenCoachMedia({
                                thumbnailUrl: exerciseSection.demoThumbnailUrl,
                                title: exerciseSection.demoTitle,
                                url: exerciseSection.demoUrl,
                                videoId: exerciseSection.demoVideoId,
                              });
                              return;
                            }

                            Linking.openURL(exerciseSection.demoUrl).catch(() => {});
                          }}
                        >
                          <View className="flex-row items-stretch gap-3">
                            <View className="relative h-[84px] w-[132px] overflow-hidden bg-white/[0.06]">
                              {exerciseSection.demoThumbnailUrl ? (
                                <Image
                                  source={{ uri: exerciseSection.demoThumbnailUrl }}
                                  resizeMode="cover"
                                  style={StyleSheet.absoluteFillObject}
                                />
                              ) : (
                                <View className="flex-1 items-center justify-center">
                                  <Ionicons color={colors.white} name="play-circle-outline" size={30} />
                                </View>
                              )}
                              <View className="absolute inset-0 bg-black/20" />
                              <View className="absolute inset-0 items-center justify-center">
                                <View className="h-10 w-10 items-center justify-center rounded-full bg-black/55">
                                  <Ionicons color={colors.white} name="play" size={18} />
                                </View>
                              </View>
                            </View>
                            <View className="flex-1 justify-center gap-1 pr-3">
                              <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                                COACH DEMO
                              </Typography>
                              <Typography numberOfLines={1} tone="inverse" variant="bodyMd">
                                {exerciseSection.demoTitle}
                              </Typography>
                              <Typography className="opacity-72" tone="inverse" variant="labelSm">
                                YouTube
                              </Typography>
                            </View>
                            <View className="justify-center pr-3">
                              <Ionicons color={colors.white} name="arrow-forward" size={16} />
                            </View>
                          </View>
                        </Pressable>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          className="flex-row items-center gap-3 overflow-hidden rounded-lg border border-white/12 bg-white/[0.04]"
                          onPress={() => {
                            Linking.openURL(exerciseSection.demoUrl).catch(() => {});
                          }}
                        >
                          <View className="h-[72px] w-28 items-center justify-center bg-white/[0.06]">
                            <Ionicons color={colors.white} name="play-circle-outline" size={28} />
                          </View>
                          <View className="flex-1 gap-1 pr-3">
                            <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                              DEMO
                            </Typography>
                            <Typography tone="inverse" variant="bodyMd">
                              {exerciseSection.demoLabel}
                            </Typography>
                            <Typography className="opacity-72" tone="inverse" variant="labelSm">
                              Search exercise form on YouTube
                            </Typography>
                          </View>
                          <View className="pr-3">
                            <Ionicons color={colors.white} name="arrow-forward" size={16} />
                          </View>
                        </Pressable>
                      )}

                      <View className="gap-2">
                        <View className="flex-row items-center border-b border-white/10 pb-2">
                          <Typography
                            className="tracking-[1px] text-white/80"
                            style={{ width: SIGNAL_SET_TABLE_COLUMNS.label }}
                            tone="inverse"
                            variant="labelSm"
                          >
                            SET
                          </Typography>
                          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
                            REPS
                          </Typography>
                          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
                            LBS
                          </Typography>
                          <Typography className="flex-1 text-center tracking-[1px] text-white/80" tone="inverse" variant="labelSm">
                            RPE
                          </Typography>
                          <Typography
                            className="text-center tracking-[1px] text-white/80"
                            style={{ width: SIGNAL_SET_TABLE_COLUMNS.done }}
                            tone="inverse"
                            variant="labelSm"
                          >
                            DONE
                          </Typography>
                        </View>

                        {Array.from({ length: exerciseSection.targetSets + exerciseSection.extraSets }).map((_, index) => {
                          const setNo = index + 1;
                          const draftKey = buildWorkoutLogKey(exerciseSection.exerciseId, setNo);
                          const completed =
                            exerciseSection.completedSetNumbers.has(setNo) ||
                            pendingCompletedSetKeys.has(draftKey);
                          const isActiveSet =
                            hasStartedSession &&
                            setNo === exerciseSection.nextSetNumber &&
                            exerciseSection.completedSetNumbers.size < (exerciseSection.targetSets + exerciseSection.extraSets);
                          const draft = setDrafts[draftKey] ?? { lbs: "", reps: "", rpe: "" };
                          const displayedReps = draft.reps.length > 0 ? draft.reps : exerciseSection.prescribedReps;
                          const displayedRpe = draft.rpe.length > 0 ? draft.rpe : exerciseSection.prescribedRpe;
                          return (
                            <WorkoutSetRow
                              completed={completed}
                              index={setNo}
                              isActive={isActiveSet}
                              isEditable={hasStartedSession && Boolean(exerciseSection.workoutExercise)}
                              key={draftKey}
                              lbsValue={draft.lbs}
                              onChangeLbs={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), lbs: next },
                                }))
                              }
                              onChangeReps={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), reps: next },
                                }))
                              }
                              onChangeRpe={(next) =>
                                setSetDrafts((current) => ({
                                  ...current,
                                  [draftKey]: { ...(current[draftKey] ?? { lbs: "", reps: "", rpe: "" }), rpe: next },
                                }))
                              }
                              onToggleComplete={() => {
                                if (!exerciseSection.workoutExercise) return;
                                handleCompleteSet(exerciseSection.workoutExercise, setNo);
                              }}
                              repsValue={displayedReps}
                              rpeValue={displayedRpe}
                              setLabel={`Set ${setNo}`}
                              signalMode
                              weightInputRef={(node) => {
                                setInputRefs.current[draftKey] = node;
                              }}
                            />
                          );
                        })}

                        {hasStartedSession ? (
                          <View className="flex-row items-center justify-center gap-4 pt-2 pb-1">
                            <Pressable
                              accessibilityLabel="Remove set"
                              accessibilityRole="button"
                              disabled={exerciseSection.extraSets === 0}
                              onPress={() => {
                                const lastSetNo = exerciseSection.targetSets + exerciseSection.extraSets;
                                const isLastSetCompleted = exerciseSection.completedSetNumbers.has(lastSetNo) || pendingCompletedSetKeys.has(buildWorkoutLogKey(exerciseSection.exerciseId, lastSetNo));
                                if (isLastSetCompleted) return; // Prevent removing completed set
                                setExtraSetsByExercise((current) => ({
                                  ...current,
                                  [exerciseSection.exerciseId]: Math.max(0, (current[exerciseSection.exerciseId] ?? 0) - 1),
                                }));
                              }}
                              className={cn(
                                "h-8 w-8 items-center justify-center rounded-full border",
                                exerciseSection.extraSets > 0 && !exerciseSection.completedSetNumbers.has(exerciseSection.targetSets + exerciseSection.extraSets) && !pendingCompletedSetKeys.has(buildWorkoutLogKey(exerciseSection.exerciseId, exerciseSection.targetSets + exerciseSection.extraSets))
                                  ? "border-white/20 bg-white/10"
                                  : "border-white/5 bg-transparent opacity-40",
                              )}
                            >
                              <Ionicons color={colors.white} name="remove" size={16} />
                            </Pressable>
                            <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
                              SET
                            </Typography>
                            <Pressable
                              accessibilityLabel="Add set"
                              accessibilityRole="button"
                              onPress={() => {
                                setExtraSetsByExercise((current) => ({
                                  ...current,
                                  [exerciseSection.exerciseId]: (current[exerciseSection.exerciseId] ?? 0) + 1,
                                }));
                              }}
                              className="h-8 w-8 items-center justify-center rounded-full border border-emerald/50 bg-emerald/20"
                            >
                              <Ionicons color={colors.emerald} name="add" size={16} />
                            </Pressable>
                          </View>
                        ) : null}
                      </View>

                      <View className="gap-1.5">
                        <Typography className="tracking-[1px] opacity-90" tone="inverse" variant="labelSm">
                          NOTE
                        </Typography>
                        <TextInput
                          editable={hasStartedSession}
                          onChangeText={(next) =>
                            setExerciseNotes((current) => ({
                              ...current,
                              [exerciseSection.exerciseId]: next,
                            }))
                          }
                          placeholder="Add a quick note"
                          placeholderTextColor="rgba(255,255,255,0.42)"
                          selectionColor={colors.emerald}
                          style={[styles.noteInputCompact, styles.noteInputSignal]}
                          value={exerciseSection.note}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {isDoneTrainingStep ? (
                <View className="gap-2">
                  <Typography tone="inverse" variant="headlineXl">
                    Done Training
                  </Typography>
                  <Typography className="opacity-80" tone="inverse" variant="bodyMd">
                    Great work. Review your session before finishing.
                  </Typography>
                </View>
              ) : null}

              {isReflectionStep ? (
                <View className="gap-4">
                  <View className="gap-2">
                    <Typography className="opacity-75" tone="inverse" variant="labelSm">
                      Session Reflection
                    </Typography>
                    <Typography tone="inverse" variant="headlineXl">
                      How did this session feel?
                    </Typography>
                  </View>

                  <View className="gap-2">
                    <Typography className="opacity-75" tone="inverse" variant="labelSm">
                      Intensity
                    </Typography>
                    <View className="flex-row flex-wrap gap-2">
                      {Array.from({ length: 10 }).map((_, index) => {
                        const value = index + 1;
                        const selected = reflectionIntensity === value;
                        return (
                          <Pressable
                            key={value}
                            accessibilityRole="button"
                            className={cn(
                              "h-11 w-11 items-center justify-center rounded-full border",
                              selected ? "border-emerald bg-emerald" : "border-white/12 bg-white/6",
                            )}
                            onPress={() => setReflectionIntensity(value)}
                          >
                            <Typography tone={selected ? "inverse" : "secondary"} variant="labelMd">
                              {value}
                            </Typography>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View className="gap-2">
                    <Typography className="opacity-75" tone="inverse" variant="labelSm">
                      Duration (minutes)
                    </Typography>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={setReflectionDurationMinutes}
                      placeholder="Enter session duration"
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      selectionColor={colors.emerald}
                      style={[styles.noteInputCompact, styles.noteInputSignal]}
                      value={reflectionDurationMinutes}
                    />
                  </View>

                  <View className="gap-2">
                    <Typography className="opacity-75" tone="inverse" variant="labelSm">
                      Reflection
                    </Typography>
                    <TextInput
                      multiline
                      onChangeText={setReflectionNote}
                      placeholder="Add a quick reflection"
                      placeholderTextColor="rgba(255,255,255,0.42)"
                      selectionColor={colors.emerald}
                      style={[styles.noteInput, styles.noteInputSignal]}
                      value={reflectionNote}
                    />
                  </View>

                  <Pressable
                    accessibilityRole="checkbox"
                    className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    onPress={() => setShareWithCoachAndTeam((current) => !current)}
                  >
                    <Typography tone="inverse" variant="bodyMd">
                      Share with coach and team
                    </Typography>
                    <View
                      className={cn(
                        "h-6 w-6 items-center justify-center rounded-full border",
                        shareWithCoachAndTeam ? "border-emerald bg-emerald" : "border-white/15 bg-white/8",
                      )}
                    >
                      {shareWithCoachAndTeam ? (
                        <Ionicons color={colors.white} name="checkmark" size={14} />
                      ) : null}
                    </View>
                  </Pressable>

                  {signalFinishError ? (
                    <Typography tone="danger" variant="labelSm">
                      {signalFinishError}
                    </Typography>
                  ) : null}
                </View>
              ) : null}

              {null}
            </View>

          </View>
        ) : null}

        {!completionSummary &&
        !isLoading &&
        !hasError &&
        !signalExecutionIssue &&
        !isSignalExecution &&
        workoutPlan &&
        workoutPlan.exercises.length > 0 &&
        activeExercise ? (
        <WorkoutExerciseHeader
          exerciseName={activeExercise.exercise.name}
          notes={activeExercise.prescription.notes ?? "Complete the exercises in this block, then continue."}
          primaryMuscle={activeExercise.exercise.primary_muscle ?? "Primary"}
        />
      ) : null}
      </View>
    </ScreenScaffold>
    {coachMediaModalNode}
    </>
  );
}

export const WorkoutPlayerScreen = memo(WorkoutPlayerScreenComponent);
