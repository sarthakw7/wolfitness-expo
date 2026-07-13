import { useFocusEffect } from "@react-navigation/native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import {
  useActiveProgram,
  useWorkoutActiveSession,
} from "@/src/hooks/queries";
import { useUpdateSignalProgramVersion } from "@/src/hooks/mutations";
import { useSignalProgramProgress } from "@/src/hooks/queries/useSignalProgramProgress";
import { useAuth } from "@/src/hooks/useAuth";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { toCalendarIsoDate } from "@/src/lib/date";
import { singleParam } from "@/src/lib/routing";
import { findDay, findWeek } from "@/src/features/signal-programs/lib/signalSelection";
import {
  buildSignalWeekCalendarDays,
  getSignalWorkoutDayPreview,
  formatMonthYearLabel,
  resolveSignalDayDate,
  resolveSignalWorkoutSelection,
} from "@/src/services/signal-workout-adapter";
import type { ActiveProgramRow } from "@/src/services/active-program.service";

import { ProgramLifecycleCard } from "@/src/features/program-lifecycle/components/ProgramLifecycleCard";
import { SignalProgramLifecycleHome } from "@/src/features/program-lifecycle/components/SignalProgramLifecycleHome";
import { SIGNAL_LIFECYCLE_ACTION_COPY } from "@/src/features/program-lifecycle/constants";
import { resolveSignalCompletedSessionId } from "@/src/features/program-lifecycle/lib/resolveSignalCompletedSessionId";
import { findFirstPlayableSignalStartPoint } from "@/src/features/program-lifecycle/services/signalProgramLifecycle.service";
import { useResetSignalProgram } from "@/src/features/program-lifecycle/hooks/useResetSignalProgram";
import { useSignalProgramLifecycle } from "@/src/features/program-lifecycle/hooks/useSignalProgramLifecycle";
import { useUnjoinSignalProgram } from "@/src/features/program-lifecycle/hooks/useUnjoinSignalProgram";
import { SignalCalendarStrip } from "@/src/features/signal-programs/components/SignalCalendarStrip";
import { SignalProgramActionCard } from "@/src/features/signal-programs/components/SignalProgramActionCard";
import { SignalTrainingCard } from "@/src/features/signal-programs/components/SignalTrainingCard";
import { SignalWorkoutPlanPreview } from "@/src/features/signal-programs/components/SignalWorkoutPlanPreview";

import { WorkoutPlayerScreen } from "./WorkoutPlayerScreen";

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

function getDayInstructions(selectedPreview: ReturnType<typeof getSignalWorkoutDayPreview>) {
  const coachInstructions = selectedPreview.coachInstructions?.trim();
  if (coachInstructions) return coachInstructions;

  const firstInstruction = selectedPreview.blocks.find((block) => block.instruction?.trim())?.instruction?.trim();
  if (firstInstruction) return firstInstruction;

  return "Review the blocks below, then start your session.";
}

function getDisplayCompletedState(selectedDayCompleted: boolean, activeSessionMatchesSelection: boolean) {
  if (selectedDayCompleted) return "Completed";
  if (activeSessionMatchesSelection) return "In Progress";
  return "Ready";
}

function isWorkoutPlayerRoute(params: {
  signalDayId?: string | string[];
  signalProgramId?: string | string[];
  signalWeekId?: string | string[];
}) {
  return Boolean(
    singleParam(params.signalProgramId) ||
      singleParam(params.signalWeekId) ||
      singleParam(params.signalDayId),
  );
}

function WorkoutTabScreenComponent() {
  const params = useLocalSearchParams<{
    signalDayId?: string;
    signalProgramId?: string;
    signalWeekId?: string;
  }>();

  if (isWorkoutPlayerRoute(params)) {
    return <WorkoutPlayerScreen />;
  }

  return <WorkoutTabHome />;
}

function WorkoutTabHome() {
  const { user } = useAuth();
  const activeProgramQuery = useActiveProgram(user?.id);
  const activeProgram = activeProgramQuery.data ?? null;
  const signalLifecycleQuery = useSignalProgramLifecycle(user?.id);
  const signalLifecycle = signalLifecycleQuery.data ?? null;
  const signalProgramRow =
    activeProgram?.source === "signal"
      ? activeProgram
      : signalLifecycle?.source === "signal"
        ? signalLifecycle
        : null;
  const isActiveSignalProgram = signalProgramRow?.status === "active";
  const isSignalLifecycleState = Boolean(signalProgramRow && signalProgramRow.status !== "active");

  if (activeProgramQuery.isLoading || signalLifecycleQuery.isLoading) {
    return (
      <ScreenScaffold
        contentClassName="gap-6"
        header={<AppTopBar centered subtitle="Training Home" title="Workouts" />}
      >
        <View className="gap-4 px-2">
          <EditorialCard className="min-h-40 bg-surface-muted" />
          <EditorialCard className="min-h-32 bg-surface-muted" />
        </View>
      </ScreenScaffold>
    );
  }

  if (isActiveSignalProgram && signalProgramRow) {
    return (
      <SignalWorkoutHome
        activeProgram={signalProgramRow}
        isActiveProgramFetching={activeProgramQuery.isFetching || signalLifecycleQuery.isFetching}
        refetchActiveProgram={async () => {
          await Promise.all([activeProgramQuery.refetch(), signalLifecycleQuery.refetch()]);
        }}
      />
    );
  }

  if (activeProgram && activeProgram.source !== "signal") {
    return <WorkoutPlayerScreen />;
  }

  if (isSignalLifecycleState && signalProgramRow) {
    return (
      <SignalProgramLifecycleHome
        lifecycle={signalProgramRow}
        isLifecycleFetching={activeProgramQuery.isFetching || signalLifecycleQuery.isFetching}
        refetchLifecycle={async () => {
          await Promise.all([activeProgramQuery.refetch(), signalLifecycleQuery.refetch()]);
        }}
      />
    );
  }

  return (
    <ScreenScaffold
      contentClassName="gap-6"
      header={<AppTopBar centered subtitle="Training Home" title="Workouts" />}
    >
      <View className="gap-4 px-2">
        <ProgramLifecycleCard
          badge="No active program"
          description="You are not currently joined to a Signal program."
          onPrimaryAction={() => {
            router.push("/(marketplace)" as never);
          }}
          primaryActionLabel="Browse Programs"
          primaryActionVariant="secondary"
          title="No active Signal program"
        />
      </View>
    </ScreenScaffold>
  );
}

function SignalWorkoutHome({
  activeProgram,
  isActiveProgramFetching,
  refetchActiveProgram,
}: {
  activeProgram: ActiveProgramRow;
  isActiveProgramFetching: boolean;
  refetchActiveProgram: () => Promise<unknown>;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const resetSignalProgramMutation = useResetSignalProgram(user?.id);
  const unjoinSignalProgramMutation = useUnjoinSignalProgram(user?.id);
  const updateSignalProgramVersionMutation = useUpdateSignalProgramVersion();
  const activeContentVersionId = activeProgram.source_program_version ?? null;
  const workoutProgramQuery = useWorkoutProgram(activeProgram.source_program_id, activeContentVersionId);
  const latestWorkoutProgramQuery = useWorkoutProgram(activeProgram.source_program_id);
  const refetchWorkoutProgram = workoutProgramQuery.refetch;
  const signalProgressQuery = useSignalProgramProgress(user?.id, activeContentVersionId);
  const firstPlayableStart = useMemo(
    () => findFirstPlayableSignalStartPoint(latestWorkoutProgramQuery.data?.weeks ?? []),
    [latestWorkoutProgramQuery.data?.weeks],
  );
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(activeProgram.current_week_key);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(activeProgram.current_day_key);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({
        queryKey: ["signal", "programs", "workout", activeProgram.source_program_id],
      });
      void refetchWorkoutProgram();
    }, [activeProgram.source_program_id, queryClient, refetchWorkoutProgram]),
  );

  useEffect(() => {
    if (__DEV__ && activeContentVersionId == null) {
      console.warn("[SignalProgram] active program has no source_program_version; using latest fallback");
    }
  }, [activeContentVersionId]);

  useEffect(() => {
    if (__DEV__) {
      console.log("[WorkoutTab] active content version", activeContentVersionId);
    }
  }, [activeContentVersionId]);

  useEffect(() => {
    setSelectedWeekKey(activeProgram.current_week_key);
    setSelectedDayKey(activeProgram.current_day_key);
  }, [
    activeProgram?.current_day_key,
    activeProgram?.current_week_key,
  ]);

  const payload = workoutProgramQuery.data ?? null;
  const latestPublishedProgram = latestWorkoutProgramQuery.data ?? null;
  const latestPublishedVersionId = latestPublishedProgram?.versionId ?? null;
  const isSameSignalVersion =
    Boolean(latestPublishedVersionId) &&
    latestPublishedVersionId === activeProgram.source_program_version;
  const program = payload?.program ?? null;
  const activeWeek = useMemo(
    () => findWeek(payload?.weeks ?? [], activeProgram.current_week_key),
    [activeProgram.current_week_key, payload?.weeks],
  );
  const selectedWeek = useMemo(
    () => findWeek(payload?.weeks ?? [], selectedWeekKey),
    [payload?.weeks, selectedWeekKey],
  );
  const selectedDay = useMemo(
    () => findDay(selectedWeek, selectedDayKey),
    [selectedDayKey, selectedWeek],
  );
  const selectedDateFromPointer = useMemo(() => {
    if (!selectedWeek || !selectedDay) return null;
    return toCalendarIsoDate(resolveSignalDayDate(activeProgram.started_at, selectedWeek, selectedDay));
  }, [activeProgram.started_at, selectedDay, selectedWeek]);
  const selectedPreview = useMemo(() => getSignalWorkoutDayPreview(selectedDay), [selectedDay]);
  const displayWeek = selectedWeek ?? activeWeek;
  const signalSessionScope = useMemo(() => {
    const sourceWeekKey = selectedWeek?.sync_key ?? activeProgram.current_week_key;
    const sourceDayKey = selectedDay?.sync_key ?? activeProgram.current_day_key;
    if (!sourceWeekKey || !sourceDayKey) return null;
    return {
      activeProgramId: activeProgram.id,
      sourceDayKey,
      sourceProgramId: activeProgram.source_program_id,
      sourceProgramVersion: activeContentVersionId,
      sourceWeekKey,
    };
  }, [
    activeContentVersionId,
    activeProgram.current_day_key,
    activeProgram.current_week_key,
    activeProgram.id,
    activeProgram.source_program_id,
    selectedDay?.sync_key,
    selectedWeek?.sync_key,
  ]);
  const activeSessionQuery = useWorkoutActiveSession(signalSessionScope);
  const pointerSelection = useMemo(
    () =>
      payload
        ? resolveSignalWorkoutSelection(payload, {
            dayId: activeProgram.current_day_key,
            weekId: activeProgram.current_week_key,
          })
        : null,
    [activeProgram.current_day_key, activeProgram.current_week_key, payload],
  );
  const activePointerValid = pointerSelection?.status === "ok";
  const completedDayKeys = useMemo(() => {
    const sessions = signalProgressQuery.data?.completedSessions ?? [];
    return new Set(
      sessions
        .filter(
          (session) =>
            session.active_program_id === activeProgram.id &&
            session.source_program_id === activeProgram.source_program_id &&
            session.source_program_version === activeProgram.source_program_version &&
            session.source_week_key === selectedWeek?.sync_key,
        )
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [
    activeProgram.source_program_id,
    activeProgram.id,
    activeProgram.source_program_version,
    selectedWeek?.sync_key,
    signalProgressQuery.data?.completedSessions,
  ]);
  const completedSignalDayKeys = useMemo(() => {
    const sessions = signalProgressQuery.data?.completedSessions ?? [];
    return new Set(
      sessions
        .filter(
          (session) =>
            session.active_program_id === activeProgram.id &&
            session.source_program_id === activeProgram.source_program_id &&
            session.source_program_version === activeProgram.source_program_version,
        )
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [
    activeProgram.id,
    activeProgram.source_program_id,
    activeProgram.source_program_version,
    signalProgressQuery.data?.completedSessions,
  ]);
  const activeSession = activeSessionQuery.data ?? null;
  const hasUpdateToLatest = Boolean(
    latestPublishedVersionId &&
      latestPublishedVersionId !== activeProgram.source_program_version,
  );
  const isUpdateVersionPending = updateSignalProgramVersionMutation.isPending;
  const updateBannerButtonDisabled =
    !activeProgram ||
    !latestPublishedVersionId ||
    isSameSignalVersion ||
    isUpdateVersionPending;
  const selectedDayCompleted = Boolean(selectedDay?.sync_key && completedDayKeys.has(selectedDay.sync_key));
  const selectedDayCompletedSessionId = useMemo(
    () =>
      resolveSignalCompletedSessionId({
        completedSessions: signalProgressQuery.data?.completedSessions,
        fallbackSessionId: activeProgram.last_completed_session_id,
        activeProgramId: activeProgram.id,
        dayKey: selectedDay?.sync_key ?? null,
        programId: activeProgram.source_program_id,
        programVersion: activeProgram.source_program_version ?? null,
        weekKey: selectedWeek?.sync_key ?? null,
      }),
    [
      activeProgram.id,
      activeProgram.last_completed_session_id,
      activeProgram.source_program_id,
      activeProgram.source_program_version,
      selectedDay?.sync_key,
      selectedWeek?.sync_key,
      signalProgressQuery.data?.completedSessions,
    ],
  );
  const hasMatchingOpenSignalSession = Boolean(
    activeSession?.source === "signal" && activeSession.completed_at === null && activeSession.cancelled_at === null,
  );
  const isPlayableDay = Boolean(selectedWeek && selectedDay && selectedPreview.isPlayable);
  const sessionActionType = selectedDayCompleted
    ? "summary"
    : hasMatchingOpenSignalSession
      ? "resume"
      : "start";
  const ctaState = selectedDayCompleted ? "completed" : hasMatchingOpenSignalSession ? "in_progress" : "ready";
  const selectedSignalDay = selectedDay
    ? {
        ...selectedPreview,
        coachInstructions: selectedPreview.coachInstructions,
        id: selectedDay.sync_key,
        status: ctaState,
      }
    : null;
  const coachInstructionsText = getDayInstructions(selectedSignalDay ?? selectedPreview);
  const canOpenSelectedWorkoutSections = Boolean(
    selectedWeek &&
      selectedDay &&
      !selectedDayCompleted &&
      (selectedPreview.blocks.length > 0 || coachInstructionsText.trim().length > 0),
  );
  if (__DEV__) {
    console.log("[SignalHome] selected day", selectedSignalDay?.id, selectedSignalDay?.status);
    console.log("[WorkoutTab] coach instructions shown", selectedSignalDay?.coachInstructions);
  }
  const calendarStrip = useMemo(
    () =>
      buildSignalWeekCalendarDays(
        payload,
        activeProgram.started_at,
        displayWeek?.sync_key ?? activeProgram.current_week_key,
        selectedDateIso,
        completedSignalDayKeys,
      ),
    [
      activeProgram.current_week_key,
      activeProgram.started_at,
      completedSignalDayKeys,
      displayWeek?.sync_key,
      payload,
      selectedDateIso,
    ],
  );
  const selectedCalendarCell = useMemo(
    () => calendarStrip?.days.find((cell) => cell.isSelected) ?? null,
    [calendarStrip],
  );
  const selectedMonthYearDate = useMemo(() => {
    if (selectedCalendarCell?.date) return selectedCalendarCell.date;

    if (selectedDateFromPointer) {
      const selectedPointerDate = new Date(selectedDateFromPointer);
      if (!Number.isNaN(selectedPointerDate.getTime())) return selectedPointerDate;
    }

    const todayCell = calendarStrip?.days.find((cell) => cell.isToday) ?? null;
    if (todayCell?.date) return todayCell.date;

    return calendarStrip?.days[0]?.date ?? null;
  }, [calendarStrip, selectedCalendarCell?.date, selectedDateFromPointer]);

  useEffect(() => {
    if (selectedDateFromPointer) {
      setSelectedDateIso(selectedDateFromPointer);
    }
  }, [selectedDateFromPointer]);

  const errorCode = getProgramsErrorCode(workoutProgramQuery.error);
  const isUnavailableError =
    errorCode === "NOT_FOUND" ||
    errorCode === "PARSE_ERROR" ||
    errorCode === "CONFIGURATION_ERROR" ||
    errorCode === "BAD_REQUEST";
  const isRefreshing =
    isActiveProgramFetching ||
    workoutProgramQuery.isFetching ||
    signalProgressQuery.isFetching ||
    activeSessionQuery.isFetching;
  const openSignalWorkout = useCallback(
    ({
      blockIndex = 0,
      exerciseIndex,
      stepType,
    }: {
      blockIndex?: number;
      exerciseIndex?: number;
      stepType?: "coach" | "summary";
    } = {}) => {
      if (!selectedWeek || !selectedDay) return;
      router.push({
        pathname: "/(tabs)/workouts",
        params: {
          signalBlockIndex: String(blockIndex),
          signalDayId: selectedDay.sync_key,
          signalExerciseIndex: typeof exerciseIndex === "number" ? String(exerciseIndex) : undefined,
          signalProgramId: activeProgram.source_program_id,
          signalStepType: stepType,
          signalWeekId: selectedWeek.sync_key,
        },
      });
    },
    [activeProgram.source_program_id, selectedDay, selectedWeek],
  );

  const handleSelectedDayPrimaryAction = useCallback(() => {
    if (selectedDayCompleted) {
      if (selectedDayCompletedSessionId) {
        router.push(`/(tabs)/history/${selectedDayCompletedSessionId}` as never);
        return;
      }

      router.push("/(tabs)/history" as never);
      return;
    }

    openSignalWorkout({ stepType: "coach" });
  }, [openSignalWorkout, selectedDayCompleted, selectedDayCompletedSessionId]);

  const handleResetProgram = useCallback(() => {
    if (!firstPlayableStart) {
      Alert.alert(
        "Reset unavailable",
        "This program does not have a playable starting workout.",
      );
      return;
    }

    Alert.alert(
      SIGNAL_LIFECYCLE_ACTION_COPY.reset.confirmationTitle,
      SIGNAL_LIFECYCLE_ACTION_COPY.reset.confirmationBody,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: SIGNAL_LIFECYCLE_ACTION_COPY.reset.label,
          onPress: () => {
            resetSignalProgramMutation
              .mutateAsync({
                activeProgramId: activeProgram.id,
                firstPlayableStart,
                signalProgramId: activeProgram.source_program_id,
                signalProgramVersion: latestPublishedVersionId ?? activeProgram.source_program_version ?? null,
              })
              .then(async () => {
                await Promise.all([
                  refetchActiveProgram(),
                  workoutProgramQuery.refetch(),
                  latestWorkoutProgramQuery.refetch(),
                  signalProgressQuery.refetch(),
                  activeSessionQuery.refetch(),
                ]);
                router.replace("/(tabs)/workouts");
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to reset this Signal program.";
                Alert.alert("Reset unavailable", message);
              });
          },
        },
      ],
    );
  }, [
    activeProgram.id,
    activeProgram.source_program_id,
    activeProgram.source_program_version,
    activeSessionQuery,
    firstPlayableStart,
    latestPublishedVersionId,
    latestWorkoutProgramQuery,
    resetSignalProgramMutation,
    refetchActiveProgram,
    signalProgressQuery,
    workoutProgramQuery,
  ]);

  const handleUnjoinProgram = useCallback(() => {
    Alert.alert(
      SIGNAL_LIFECYCLE_ACTION_COPY.unjoin.confirmationTitle,
      SIGNAL_LIFECYCLE_ACTION_COPY.unjoin.confirmationBody,
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: SIGNAL_LIFECYCLE_ACTION_COPY.unjoin.label,
          onPress: () => {
            unjoinSignalProgramMutation
              .mutateAsync({
                activeProgramId: activeProgram.id,
                signalProgramId: activeProgram.source_program_id,
              })
              .then(() => {
                router.replace("/(tabs)/workouts");
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to leave this Signal program.";
                Alert.alert("Leave unavailable", message);
              });
          },
        },
      ],
    );
  }, [activeProgram.id, activeProgram.source_program_id, unjoinSignalProgramMutation]);

  const handleUpdateToLatest = useCallback(() => {
    if (updateBannerButtonDisabled) {
      console.log("[SignalVersionUpdate] disabled reason", {
        activeVersionId: activeProgram?.source_program_version ?? null,
        hasActiveProgram: Boolean(activeProgram),
        isPending: isUpdateVersionPending,
        isSameVersion: Boolean(isSameSignalVersion),
        latestVersionId: latestPublishedVersionId ?? null,
      });
      return;
    }

    console.log("[SignalVersionUpdate] Update button pressed", {
      activeVersionId: activeProgram.source_program_version ?? null,
      latestVersionId: latestPublishedVersionId,
      programId: activeProgram.source_program_id,
    });

    Alert.alert(
      "Update program?",
      "This switches you to the latest coach-published version. Your completed workout history will be kept.",
      [
        { style: "cancel", text: "Cancel" },
        {
          text: "Update",
          onPress: () => {
            updateSignalProgramVersionMutation
              .mutateAsync({
                activeProgramId: activeProgram.id,
                nextSignalProgramVersion: latestPublishedVersionId,
                previousSignalProgramVersion: activeProgram.source_program_version ?? null,
                signalProgramId: activeProgram.source_program_id,
              })
              .then(async () => {
                await Promise.all([
                  refetchActiveProgram(),
                  workoutProgramQuery.refetch(),
                  latestWorkoutProgramQuery.refetch(),
                  signalProgressQuery.refetch(),
                  activeSessionQuery.refetch(),
                ]);
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to update this program to the latest version.";
                Alert.alert("Update unavailable", message);
              });
          },
        },
      ],
    );
  }, [
    activeSessionQuery,
    activeProgram,
    isSameSignalVersion,
    isUpdateVersionPending,
    latestPublishedVersionId,
    latestWorkoutProgramQuery,
    refetchActiveProgram,
    signalProgressQuery,
    updateBannerButtonDisabled,
    updateSignalProgramVersionMutation,
    workoutProgramQuery,
  ]);

  useEffect(() => {
    if (!payload || !activePointerValid) return;
    console.log("[SignalHome] rendering session CTA", {
      signalDayId: selectedDay?.sync_key ?? activeProgram.current_day_key,
      signalProgramId: activeProgram.source_program_id,
      signalWeekId: selectedWeek?.sync_key ?? activeProgram.current_week_key,
      status: ctaState,
    });
  }, [
    activePointerValid,
    activeProgram.current_day_key,
    activeProgram.current_week_key,
    activeProgram.source_program_id,
    ctaState,
    payload,
    selectedDay?.sync_key,
    selectedWeek?.sync_key,
  ]);

  return (
    <ScreenScaffold
      contentClassName="gap-6"
      header={<AppTopBar centered subtitle="Training Home" title="Workouts" />}
      refreshControl={
        <RefreshControl
          onRefresh={async () => {
            await Promise.all([
              refetchActiveProgram(),
              workoutProgramQuery.refetch(),
              latestWorkoutProgramQuery.refetch(),
              signalProgressQuery.refetch(),
              activeSessionQuery.refetch(),
            ]);
          }}
          refreshing={isRefreshing}
        />
      }
    >
      <View className="gap-4 px-2">
        {workoutProgramQuery.isLoading ? (
          <>
            <EditorialCard className="min-h-40 bg-surface-muted" />
            <EditorialCard className="min-h-32 bg-surface-muted" />
          </>
        ) : null}

        {workoutProgramQuery.error && !isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load active workout</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Check your connection and try again.
            </Typography>
            <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Program unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This active Signal program is no longer available or returned an invalid workout payload.
            </Typography>
            <Link asChild href="/(marketplace)">
              <AppButton variant="secondary">Browse Programs</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        {payload && !activePointerValid ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Active program unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your active Signal program points to a week or day that is no longer available.
            </Typography>
            <View className="gap-2">
              <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
              <Link asChild href="/(marketplace)">
                <AppButton variant="ghost">Browse Programs</AppButton>
              </Link>
            </View>
          </EditorialCard>
        ) : null}

        {payload && activePointerValid ? (
          <>
            {calendarStrip ? (
              <SignalCalendarStrip
                days={calendarStrip.days}
                monthYearLabel={selectedMonthYearDate ? formatMonthYearLabel(selectedMonthYearDate) : calendarStrip.monthYearLabel}
                onDayPress={(cell) => {
                  setSelectedDateIso(toCalendarIsoDate(cell.date));
                  if (cell.isAssigned && cell.weekKey && cell.dayKey) {
                    setSelectedWeekKey(cell.weekKey);
                    setSelectedDayKey(cell.dayKey);
                    return;
                  }
                  setSelectedWeekKey(displayWeek?.sync_key ?? activeProgram.current_week_key);
                  setSelectedDayKey(null);
                }}
                weekTitle={selectedWeek?.title ?? activeWeek?.title ?? "Current week"}
              />
            ) : null}

            <SignalTrainingCard
              actionType={sessionActionType}
              blockCount={selectedPreview.blockCount}
              dayTitle={selectedDay?.title ?? selectedCalendarCell?.title ?? "Selected day"}
              exerciseCount={selectedPreview.exerciseCount}
              hasUpdateToLatest={hasUpdateToLatest}
              isPlayableDay={isPlayableDay}
              isUpdateVersionPending={isUpdateVersionPending}
              onPrimaryAction={handleSelectedDayPrimaryAction}
              onUpdateToLatest={handleUpdateToLatest}
              programTitle={program?.title ?? "Signal Program"}
              statusLabel={getDisplayCompletedState(selectedDayCompleted, hasMatchingOpenSignalSession)}
              updateBannerButtonDisabled={updateBannerButtonDisabled}
              weekTitle={selectedWeek?.title ?? activeWeek?.title ?? "Current week"}
            />

            <SignalProgramActionCard
              isResetting={resetSignalProgramMutation.isPending}
              isUnjoining={unjoinSignalProgramMutation.isPending}
              onReset={handleResetProgram}
              onUnjoin={handleUnjoinProgram}
            />

            <SignalWorkoutPlanPreview
              canOpenSelectedWorkoutSections={canOpenSelectedWorkoutSections}
              coachInstructionsText={coachInstructionsText}
              onOpenBlock={(blockIndex) => openSignalWorkout({ blockIndex })}
              onOpenCoach={() => openSignalWorkout({ stepType: "coach" })}
              onOpenExercise={(blockIndex, exerciseIndex) => openSignalWorkout({ blockIndex, exerciseIndex })}
              selectedCalendarCell={selectedCalendarCell}
              selectedDay={selectedDay}
              selectedDayCompleted={selectedDayCompleted}
              selectedPreview={selectedPreview}
              selectedWeek={selectedWeek}
              showUnavailableButton={Boolean(payload && activePointerValid)}
            />
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const WorkoutTabScreen = memo(WorkoutTabScreenComponent);
