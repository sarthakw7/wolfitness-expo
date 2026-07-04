import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import {
  useActiveProgram,
  useWorkoutActiveSession,
} from "@/src/hooks/queries";
import { useResetSignalEnrollment, useUpdateSignalProgramVersion } from "@/src/hooks/mutations";
import { useSignalProgramProgress } from "@/src/hooks/queries/useSignalProgramProgress";
import { useAuth } from "@/src/hooks/useAuth";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { cn } from "@/src/lib/cn";
import {
  buildSignalWeekCalendarDays,
  getSignalWorkoutDayPreview,
  getSignalBlockLabel,
  getSignalExerciseLabel,
  formatMonthYearLabel,
  resolveSignalDayDate,
  resolveSignalWorkoutSelection,
} from "@/src/services/signal-workout-adapter";
import type { ActiveProgramRow } from "@/src/services/active-program.service";
import type { WorkoutProgramPayloadExercise, WorkoutProgramPayloadWeek } from "@/src/services/programs";
import { colors } from "@/src/theme";

import { WorkoutPlayerScreen } from "./WorkoutPlayerScreen";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

function findWeek(weeks: WorkoutProgramPayloadWeek[], weekKey: string | null | undefined) {
  if (!weekKey) return null;
  return weeks.find((week) => week.id === weekKey || week.sync_key === weekKey) ?? null;
}

function findDay(week: WorkoutProgramPayloadWeek | null, dayKey: string | null | undefined) {
  if (!week || !dayKey) return null;
  return week.days.find((day) => day.id === dayKey || day.sync_key === dayKey) ?? null;
}

function getDayInstructions(selectedPreview: ReturnType<typeof getSignalWorkoutDayPreview>) {
  const coachInstructions = selectedPreview.coachInstructions?.trim();
  if (coachInstructions) return coachInstructions;

  const firstInstruction = selectedPreview.blocks.find((block) => block.instruction?.trim())?.instruction?.trim();
  if (firstInstruction) return firstInstruction;

  return "Review the blocks below, then start your session.";
}

function getExercisePrescription(exercise: WorkoutProgramPayloadExercise) {
  const parts = [exercise.sets?.trim() ? `${exercise.sets.trim()} sets` : null];
  if (exercise.reps?.trim()) parts.push(`${exercise.reps.trim()} reps`);
  if (exercise.rpe?.trim()) parts.push(`RPE ${exercise.rpe.trim()}`);
  if (exercise.rest?.trim()) parts.push(`Rest ${exercise.rest.trim()}`);
  return parts.filter(Boolean).join(" · ");
}

function getDisplayCompletedState(selectedDayCompleted: boolean, activeSessionMatchesSelection: boolean) {
  if (selectedDayCompleted) return "Completed";
  if (activeSessionMatchesSelection) return "In Progress";
  return "Ready";
}

function toCalendarIsoDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  const isActiveSignalProgram = activeProgram?.source === "signal" && activeProgram.status === "active";

  if (activeProgramQuery.isLoading) {
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

  if (!isActiveSignalProgram) {
    return <WorkoutPlayerScreen />;
  }

  return (
    <SignalWorkoutHome
      activeProgram={activeProgram}
      isActiveProgramFetching={activeProgramQuery.isFetching}
      refetchActiveProgram={activeProgramQuery.refetch}
    />
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
  const resetSignalEnrollmentMutation = useResetSignalEnrollment();
  const updateSignalProgramVersionMutation = useUpdateSignalProgramVersion();
  const activeContentVersionId = activeProgram.source_program_version ?? null;
  const workoutProgramQuery = useWorkoutProgram(activeProgram.source_program_id, activeContentVersionId);
  const latestWorkoutProgramQuery = useWorkoutProgram(activeProgram.source_program_id);
  const refetchWorkoutProgram = workoutProgramQuery.refetch;
  const signalProgressQuery = useSignalProgramProgress(user?.id, activeContentVersionId);
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
            session.source_program_id === activeProgram.source_program_id &&
            session.source_program_version === activeProgram.source_program_version &&
            session.source_week_key === selectedWeek?.sync_key,
        )
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [
    activeProgram.source_program_id,
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
            session.source_program_id === activeProgram.source_program_id &&
            session.source_program_version === activeProgram.source_program_version,
        )
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [
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
  const hasMatchingOpenSignalSession = Boolean(
    activeSession?.source === "signal" && activeSession.completed_at === null && activeSession.cancelled_at === null,
  );
  const ctaLabel = selectedDayCompleted
    ? "VIEW SUMMARY"
    : hasMatchingOpenSignalSession
      ? "Resume Session"
      : "Start Session";
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
      (selectedPreview.blocks.length > 0 || coachInstructionsText.trim().length > 0),
  );
  if (__DEV__) {
    console.log("[SignalHome] selected day", selectedSignalDay?.id, selectedSignalDay?.status);
    console.log("[WorkoutTab] coach instructions shown", selectedSignalDay?.coachInstructions);
    console.log("[SignalHomeCTA] scoped decision", {
      activeProgramId: activeProgram.id,
      sourceProgramId: activeProgram.source_program_id,
      sourceProgramVersion: activeContentVersionId,
      sourceWeekKey: signalSessionScope?.sourceWeekKey ?? null,
      sourceDayKey: signalSessionScope?.sourceDayKey ?? null,
      scopedSessionId: activeSession?.id ?? null,
      reason: selectedDayCompleted ? "completed" : hasMatchingOpenSignalSession ? "resume" : "start",
      label: ctaLabel,
    });
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
  const openSignalWorkout = ({
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
  };

  const handleResetEnrollment = useCallback(() => {
    Alert.alert(
      "Reset enrollment?",
      "This will remove your current active Signal enrollment for this program. You can enroll again into the latest coach-published version.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Reset Enrollment",
          onPress: () => {
            resetSignalEnrollmentMutation
              .mutateAsync({
                activeProgramId: activeProgram.id,
                signalProgramId: activeProgram.source_program_id,
                signalProgramVersion: activeProgram.source_program_version ?? null,
              })
              .then(() => {
                router.replace({
                  pathname: "/(signal)/program/[programId]",
                  params: {
                    programId: activeProgram.source_program_id,
                  },
                });
              })
              .catch((error) => {
                const message = error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Unable to reset this Signal enrollment.";
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
    resetSignalEnrollmentMutation,
  ]);

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
              <EditorialCard className="gap-2.5">
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    {selectedMonthYearDate ? formatMonthYearLabel(selectedMonthYearDate) : calendarStrip.monthYearLabel}
                  </Typography>
                  <View className="flex-row items-end justify-between gap-3">
                    <Typography variant="headlineLg">{selectedWeek?.title ?? activeWeek?.title ?? "Current week"}</Typography>
                    <Typography tone="secondary" variant="labelSm">
                      Weekly plan
                    </Typography>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2 pr-2">
                    {calendarStrip.days.map((cell) => {
                      const assignedWorkout = cell.isAssigned;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          className={`min-w-14 rounded-xl border px-2.5 py-2 ${
                            cell.isSelected
                              ? "border-emerald bg-emerald/8"
                              : assignedWorkout
                                ? cell.isCompleted
                                  ? "border-emerald/35 bg-emerald/8"
                                  : "border-border bg-background"
                                : "border-border/50 bg-background/40"
                          }`}
                          key={`${cell.weekKey ?? "rest"}:${cell.dayKey ?? cell.dayLabel}:${toCalendarIsoDate(cell.date)}`}
                          onPress={() => {
                            setSelectedDateIso(toCalendarIsoDate(cell.date));
                            if (cell.isAssigned && cell.weekKey && cell.dayKey) {
                              setSelectedWeekKey(cell.weekKey);
                              setSelectedDayKey(cell.dayKey);
                              return;
                            }
                            setSelectedWeekKey(displayWeek?.sync_key ?? activeProgram.current_week_key);
                            setSelectedDayKey(null);
                          }}
                        >
                          <View className="gap-1.5">
                            <View className="flex-row items-center justify-between gap-2">
                              <Typography tone="secondary" variant="labelSm">
                                {cell.weekdayLabel}
                              </Typography>
                              <View className="flex-row items-center gap-1">
                                {cell.isToday ? (
                                  <View className="rounded-full border border-emerald/30 px-1 py-0.5">
                                    <Typography tone="primary" variant="labelSm">
                                      TODAY
                                    </Typography>
                                  </View>
                                ) : null}
                                {cell.isCompleted ? (
                                  <Ionicons color={colors.emerald} name="checkmark-circle" size={16} />
                                ) : cell.isAssigned ? (
                                  <View className="h-2 w-2 rounded-full bg-emerald" />
                                ) : (
                                  <View className="h-1.5 w-1.5 rounded-full bg-border" />
                                )}
                              </View>
                            </View>
                            <Typography variant="bodyLg">{cell.dayLabel}</Typography>
                            <Typography numberOfLines={1} tone="secondary" variant="labelSm">
                              {cell.isAssigned ? "Planned" : "Rest"}
                            </Typography>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </EditorialCard>
            ) : null}

            <EditorialCard className="gap-2.5 overflow-hidden">
              <View className="gap-1.5">
                <View className="flex-row items-center justify-between gap-3">
                  <Typography tone="secondary" variant="labelSm">
                    TRAINING
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    className="rounded-full border border-border px-3 py-1.5 active:bg-surface-muted"
                    disabled={resetSignalEnrollmentMutation.isPending}
                    onPress={handleResetEnrollment}
                  >
                    <Typography tone="secondary" variant="labelSm">
                      {resetSignalEnrollmentMutation.isPending ? "Resetting..." : "Reset Enrollment"}
                    </Typography>
                  </Pressable>
                </View>
                <Typography variant="headlineLg">{program?.title ?? "Signal Program"}</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {selectedWeek?.title ?? activeWeek?.title ?? "Current week"} ·{" "}
                  {selectedDay?.title ?? selectedCalendarCell?.title ?? "Selected day"}
                </Typography>
                <View className="flex-row items-center gap-3 border-t border-border pt-2.5">
                  <View className="flex-1 gap-1">
                    <Typography tone="secondary" variant="labelSm">
                      Status
                    </Typography>
                    <Typography variant="bodyMd">
                      {getDisplayCompletedState(selectedDayCompleted, hasMatchingOpenSignalSession)}
                    </Typography>
                  </View>
                  <View className="h-8 w-px bg-border" />
                  <View className="flex-1 gap-1">
                    <Typography tone="secondary" variant="labelSm">
                      Blocks
                    </Typography>
                    <Typography variant="bodyMd">{selectedPreview.blockCount}</Typography>
                  </View>
                  <View className="h-8 w-px bg-border" />
                  <View className="flex-1 gap-1">
                    <Typography tone="secondary" variant="labelSm">
                      Exercises
                    </Typography>
                    <Typography variant="bodyMd">{selectedPreview.exerciseCount}</Typography>
                  </View>
                  <View className="h-8 w-px bg-border" />
                  <View className="flex-1 gap-1">
                    <Typography tone="secondary" variant="labelSm">
                      Minutes
                    </Typography>
                    <Typography variant="bodyMd">--</Typography>
                  </View>
                </View>
                {hasUpdateToLatest ? (
                  <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-emerald/25 bg-emerald/8 px-3 py-3">
                    <View className="flex-1 gap-0.5">
                      <Typography tone="primary" variant="labelSm">
                        Update available
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        Coach published a newer version.
                      </Typography>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      className={cn(
                        "min-h-10 min-w-[88px] items-center justify-center rounded-full px-4",
                        updateBannerButtonDisabled ? "bg-emerald/30 opacity-60" : "bg-emerald active:opacity-85",
                      )}
                      disabled={updateBannerButtonDisabled}
                      onPress={handleUpdateToLatest}
                    >
                      <Typography tone="inverse" variant="labelSm">
                        {isUpdateVersionPending ? "Updating..." : "Update"}
                      </Typography>
                    </Pressable>
                  </View>
                ) : null}
                <View className="pt-6">
                  <Pressable
                    accessibilityRole="button"
                    className={cn(
                      "w-full items-center justify-center rounded-2xl px-4",
                      selectedDayCompleted ? "border border-border bg-background" : "bg-emerald",
                    )}
                    onPress={() => {
                      console.log("[SignalHome] rendering CTA");
                      openSignalWorkout({ stepType: "coach" });
                    }}
                    style={{ height: 52, marginTop: 24, borderRadius: 16 }}
                  >
                    <Typography tone={selectedDayCompleted ? "primary" : "inverse"} variant="labelMd">
                      {ctaLabel}
                    </Typography>
                  </Pressable>
                </View>
              </View>
            </EditorialCard>

            {selectedDay && selectedWeek ? (
              <EditorialCard className="gap-4 overflow-hidden">
                <View className="gap-1.5">
                  <Typography tone="secondary" variant="labelSm">
                    TODAY&apos;S TRAINING
                  </Typography>
                  <Typography variant="headlineLg">{selectedDay.title}</Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    {selectedWeek.title} · {selectedDayCompleted ? "Completed" : "Ready to train"}
                  </Typography>
                </View>

                <Pressable
                  accessibilityRole={canOpenSelectedWorkoutSections ? "button" : undefined}
                  className={cn(
                    "gap-1.5 border-t border-border pt-2",
                    canOpenSelectedWorkoutSections ? "rounded-lg active:bg-surface-muted" : "",
                  )}
                  disabled={!canOpenSelectedWorkoutSections}
                  onPress={() => openSignalWorkout({ stepType: "coach" })}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-1.5">
                      <Typography tone="secondary" variant="labelSm">
                        COACH INSTRUCTIONS
                      </Typography>
                      <Typography variant="bodyMd">{coachInstructionsText}</Typography>
                    </View>
                    {canOpenSelectedWorkoutSections ? (
                      <View className="flex-row items-center gap-1 pt-0.5">
                        <Typography tone="secondary" variant="labelSm">
                          Open
                        </Typography>
                        <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={16} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {selectedPreview.blocks.length > 0 ? (
                  <View className="gap-3">
                    <Typography tone="secondary" variant="labelSm">
                      WORKOUT PLAN
                    </Typography>
                    {selectedPreview.blocks.map((block, index) => {
                      const isOpenableBlock = canOpenSelectedWorkoutSections;
                      const isPlayableBlock = block.isPlayable && isOpenableBlock;
                      const blockLabel = getSignalBlockLabel(index);
                      const hasExercises = selectedDay.blocks[index]?.exercises.length > 0;
                      const blockExercises = selectedDay.blocks[index]?.exercises ?? [];
                      return (
                        <View className="flex-row items-start gap-3" key={block.key}>
                          <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald">
                            <Typography className="text-white" variant="labelMd">
                              {blockLabel}
                            </Typography>
                          </View>
                          <View className="flex-1 gap-1.5 border-b border-border pb-3">
                            <View className="flex-row items-start justify-between gap-3">
                              <View className="flex-1 gap-0.5">
                                <Typography variant="bodyLg">{block.title}</Typography>
                                <Typography tone="secondary" variant="labelSm">
                                  {block.isInstructionOnly ? "Instruction block" : block.isMixed ? "Mixed block" : "Exercise block"}
                                </Typography>
                              </View>
                              <Typography tone={selectedDayCompleted ? "accent" : "secondary"} variant="labelSm">
                                {selectedDayCompleted ? "Completed" : hasExercises ? "Ready" : "Instructions"}
                              </Typography>
                            </View>

                            {block.instruction ? (
                              <Typography tone="secondary" variant="bodyMd">
                                {block.instruction}
                              </Typography>
                            ) : null}

                            {hasExercises ? (
                              <View className="gap-1 pt-0.5">
                                {blockExercises.map((exercise, exerciseIndex) => {
                                  const exerciseLabel = getSignalExerciseLabel(blockLabel, exerciseIndex);
                                  const prescription = getExercisePrescription(exercise);
                                  return (
                                    <Pressable
                                      accessibilityRole="button"
                                      className={`flex-row items-start gap-3 rounded-lg px-1 py-1.5 ${
                                        isPlayableBlock ? "active:bg-surface-muted" : ""
                                      }`}
                                      key={exercise.sync_key}
                                      onPress={() => {
                                        if (!isPlayableBlock) return;
                                        openSignalWorkout({ blockIndex: index, exerciseIndex });
                                      }}
                                    >
                                      <View className="mt-0.5 min-w-10 items-center rounded-full bg-emerald/10 px-2 py-1">
                                        <Typography tone="primary" variant="labelSm">
                                          {exerciseLabel}
                                        </Typography>
                                      </View>
                                      <View className="flex-1 gap-0.5">
                                        <Typography variant="bodyMd">{exercise.exerciseName}</Typography>
                                        {prescription ? (
                                          <Typography tone="secondary" variant="labelSm">
                                            {prescription}
                                          </Typography>
                                        ) : null}
                                        {exercise.notes?.trim() ? (
                                          <Typography numberOfLines={2} tone="secondary" variant="labelSm">
                                            {exercise.notes.trim()}
                                          </Typography>
                                        ) : null}
                                      </View>
                                      {isPlayableBlock ? (
                                        <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={16} />
                                      ) : null}
                                    </Pressable>
                                  );
                                })}
                              </View>
                            ) : block.prescriptionSummary ? (
                              <Typography tone="secondary" variant="labelSm">
                                {block.prescriptionSummary}
                              </Typography>
                            ) : null}

                            {!hasExercises && block.isInstructionOnly && !block.instruction ? (
                              <Typography tone="secondary" variant="bodyMd">
                                This block contains coach instructions only.
                              </Typography>
                            ) : null}

                            {isOpenableBlock ? (
                              <Pressable
                                accessibilityRole="button"
                                className="flex-row items-center gap-2 pt-1"
                                onPress={() => openSignalWorkout({ blockIndex: index })}
                              >
                                <Typography tone="primary" variant="labelSm">
                                  {hasExercises ? "Open block" : "Open step"}
                                </Typography>
                                <Ionicons color={colors.emerald} name="arrow-forward" size={14} />
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {!selectedPreview.blocks.length ? (
                  <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
                    <Typography variant="headlineLg">Workout preview unavailable</Typography>
                    <Typography tone="secondary" variant="bodyMd">
                      This day does not have any block details yet.
                    </Typography>
                  </View>
                ) : null}

                {!selectedPreview.isPlayable ? (
                  <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
                    <Typography variant="headlineLg">Rest day</Typography>
                    <Typography tone="secondary" variant="bodyMd">
                      This selected day does not contain playable exercises.
                    </Typography>
                  </View>
                ) : null}

              </EditorialCard>
            ) : (
              <EditorialCard className="gap-3">
                <Typography variant="headlineLg">Rest Day</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {selectedCalendarCell?.title
                    ? `No workout assigned for ${selectedCalendarCell.weekdayLabel} ${selectedCalendarCell.dayLabel}.`
                    : "No workout assigned for this selected date."}
                </Typography>
                {payload && activePointerValid ? (
                  <AppButton disabled size="lg" variant="secondary">
                    Unavailable
                  </AppButton>
                ) : null}
              </EditorialCard>
            )}
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const WorkoutTabScreen = memo(WorkoutTabScreenComponent);
