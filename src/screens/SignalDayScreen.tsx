import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useActiveProgram } from "@/src/hooks/queries/useActiveProgram";
import { useSignalProgramProgress } from "@/src/hooks/queries/useSignalProgramProgress";
import { useWorkoutActiveSession } from "@/src/hooks/queries/useWorkoutActiveSession";
import { useAuth } from "@/src/hooks/useAuth";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { singleParam } from "@/src/lib/routing";
import { countExercisesInDay } from "@/src/features/signal-programs/lib/signalExerciseCounts";
import { findDay, findWeek } from "@/src/features/signal-programs/lib/signalSelection";
import { getSignalWorkoutDayPreview, isSignalPlayableDay } from "@/src/services/signal-workout-adapter";
import { colors } from "@/src/theme";

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

function SignalDayScreenComponent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ programId?: string; weekId?: string; dayId?: string }>();
  const programId = singleParam(params.programId);
  const weekId = singleParam(params.weekId);
  const dayId = singleParam(params.dayId);
  const activeProgramQuery = useActiveProgram(user?.id);
  const activeProgram = activeProgramQuery.data ?? null;
  const signalProgramVersionId =
    activeProgram?.source === "signal" && activeProgram.source_program_id === programId
      ? activeProgram.source_program_version ?? null
      : null;
  const workoutProgramQuery = useWorkoutProgram(programId, signalProgramVersionId);
  const signalProgressQuery = useSignalProgramProgress(user?.id, signalProgramVersionId);
  const isRefreshing = workoutProgramQuery.isFetching || activeProgramQuery.isLoading;

  const week = useMemo(
    () => findWeek(workoutProgramQuery.data?.weeks ?? [], weekId),
    [weekId, workoutProgramQuery.data?.weeks],
  );
  const day = useMemo(() => findDay(week, dayId), [dayId, week]);
  const signalSessionScope = useMemo(() => {
    if (
      !activeProgram ||
      activeProgram.source !== "signal" ||
      !activeProgram.id ||
      !activeProgram.source_program_id ||
      !week?.sync_key ||
      !day?.sync_key
    ) {
      return null;
    }

    return {
      activeProgramId: activeProgram.id,
      sourceDayKey: day.sync_key,
      sourceProgramId: activeProgram.source_program_id,
      sourceProgramVersion: signalProgramVersionId,
      sourceWeekKey: week.sync_key,
    };
  }, [activeProgram, day?.sync_key, signalProgramVersionId, week?.sync_key]);
  const activeSessionQuery = useWorkoutActiveSession(signalSessionScope);
  const program = workoutProgramQuery.data?.program ?? null;
  const invalidRoute = !programId || !weekId || !dayId;
  const preview = useMemo(() => getSignalWorkoutDayPreview(day), [day]);
  const dayHasExercises = preview.isPlayable;
  const completedDayKeys = useMemo(() => {
    const sessions = signalProgressQuery.data?.completedSessions ?? [];
    return new Set(
      sessions
        .filter(
          (session) =>
            session.active_program_id === activeProgram?.id &&
            session.source_program_id === program?.id &&
            session.source_week_key === week?.sync_key,
        )
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [activeProgram?.id, program?.id, signalProgressQuery.data?.completedSessions, week?.sync_key]);
  const selectedDayCompleted = Boolean(day?.sync_key && completedDayKeys.has(day.sync_key));
  const activeSession = activeSessionQuery.data ?? null;
  const selectedDayMatchesActiveProgram = Boolean(
    activeProgram?.source === "signal" &&
      activeProgram.source_program_id === program?.id &&
      activeProgram.current_week_key === week?.sync_key &&
      activeProgram.current_day_key === day?.sync_key,
  );
  const hasMatchingOpenSignalSession = Boolean(
    activeSession?.source === "signal" && activeSession.completed_at === null && activeSession.cancelled_at === null,
  );
  const ctaLabel = selectedDayCompleted
    ? "Completed"
    : !selectedDayMatchesActiveProgram
      ? "Active day unavailable"
      : hasMatchingOpenSignalSession
        ? "Resume Session"
        : "Start Session";

  const errorCode = getProgramsErrorCode(workoutProgramQuery.error);
  const isUnavailableError =
    errorCode === "NOT_FOUND" || errorCode === "PARSE_ERROR" || errorCode === "CONFIGURATION_ERROR" || errorCode === "BAD_REQUEST";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Day" title={day?.title ?? "Day"} />}
      refreshControl={
        <RefreshControl
          onRefresh={async () => {
            await workoutProgramQuery.refetch();
          }}
          refreshing={isRefreshing}
        />
      }
    >
      <View className="gap-4 px-2 pb-8">
        {invalidRoute ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Invalid workout</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This Signal day link is missing a program, week, or day id.
            </Typography>
          </EditorialCard>
        ) : null}

        {workoutProgramQuery.isLoading || activeProgramQuery.isLoading ? <EditorialCard className="min-h-48 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load day</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Check your connection and try again.
            </Typography>
            <View className="pt-2">
              <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Workout unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This workout is no longer published, was removed, or returned an invalid payload.
            </Typography>
            <View className="pt-2">
              <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {week && !invalidRoute ? (
          <EditorialCard className="gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Typography tone="secondary" variant="labelSm">
                  {week.title.toUpperCase()}
                </Typography>
                <Typography variant="headlineLg">Weekly workout flow</Typography>
              </View>
              <Typography tone="secondary" variant="labelSm">
                {week.days.filter((weekDay) => isSignalPlayableDay(weekDay)).length} playable
              </Typography>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pr-2">
                {week.days.map((weekDay, index) => {
                  const isSelected = weekDay.sync_key === day?.sync_key;
                  const isPlayable = isSignalPlayableDay(weekDay);
                  const isCompleted = completedDayKeys.has(weekDay.sync_key);
                  return (
                    <Link
                      asChild
                      href={{
                        pathname: "/program/[programId]/week/[weekId]/day/[dayId]",
                        params: {
                          dayId: weekDay.sync_key,
                          programId: program?.id ?? programId ?? "",
                          weekId: week.sync_key,
                        },
                      } as unknown as Href}
                      key={weekDay.sync_key}
                    >
                      <Pressable
                        accessibilityRole="button"
                        className={`min-w-24 rounded-3xl border p-4 ${
                          isSelected
                            ? "border-emerald bg-emerald/10"
                            : isPlayable
                              ? "border-border bg-surface-muted"
                              : "border-border/50 bg-background/40"
                        }`}
                      >
                        <View className="gap-3">
                          <View className="flex-row items-center justify-between">
                            <Typography tone="secondary" variant="labelSm">
                              Day {index + 1}
                            </Typography>
                            {isCompleted ? (
                              <Ionicons color={colors.emerald} name="checkmark-circle" size={18} />
                            ) : null}
                          </View>
                          <Typography variant="headlineLg">{weekDay.title}</Typography>
                          <Typography tone="secondary" variant="labelSm">
                            {isPlayable ? `${countExercisesInDay(weekDay.blocks)} exercises` : "Rest / unavailable"}
                          </Typography>
                        </View>
                      </Pressable>
                    </Link>
                  );
                })}
              </View>
            </ScrollView>
          </EditorialCard>
        ) : null}

        {day && !invalidRoute ? (
          <EditorialCard className="gap-4">
            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                WORKOUT PREVIEW
              </Typography>
              <Typography variant="displayLg">{day.title}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {program?.title ?? "Published Signal workout"}
              </Typography>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <Typography tone="secondary" variant="labelSm">
                Blocks {preview.blockCount}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Exercises {preview.exerciseCount}
              </Typography>
            </View>

            {preview.coachInstructions ? (
              <View className="rounded-2xl border border-border bg-surface-muted p-4">
                <Typography tone="secondary" variant="labelSm">
                  Coach notes
                </Typography>
                <Typography variant="bodyMd">{preview.coachInstructions}</Typography>
              </View>
            ) : null}

            {dayHasExercises ? (
              <View className="gap-2">
                <AppButton
                  disabled={selectedDayCompleted || !selectedDayMatchesActiveProgram}
                  onPress={() => {
                    router.push({
                      pathname: "/(tabs)/workouts",
                      params: {
                        signalDayId: day.sync_key,
                        signalProgramId: program?.id ?? programId ?? "",
                        signalWeekId: week?.sync_key ?? weekId ?? "",
                      },
                    });
                  }}
                  variant="primary"
                >
                  {ctaLabel}
                </AppButton>
                {!selectedDayMatchesActiveProgram && !selectedDayCompleted ? (
                  <Typography tone="secondary" variant="bodyMd">
                    Start or continue the program from the active day before opening a workout session.
                  </Typography>
                ) : null}
              </View>
            ) : (
              <View className="gap-3 rounded-2xl border border-border bg-surface-muted p-4">
                <Typography variant="headlineLg">Workout unavailable</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  This day does not contain any playable exercises.
                </Typography>
                <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
                  Retry
                </AppButton>
              </View>
            )}
          </EditorialCard>
        ) : null}

        <View className="gap-4">
          {preview.blocks.map((block, index) => (
            <EditorialCard className="gap-4" key={block.key}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    Block {index + 1}
                  </Typography>
                  <Typography variant="headlineXl">{block.title}</Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    {block.instruction ?? "No block instructions."}
                  </Typography>
                </View>
                <View className="items-end gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    {block.isInstructionOnly ? "Instruction" : block.isMixed ? "Mixed" : "Exercise"}
                  </Typography>
                </View>
              </View>

              <View className="gap-3 border-t border-border pt-4">
                {block.exerciseNames.length > 0 ? (
                  block.exerciseNames.map((exerciseName) => (
                    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-surface-muted p-4" key={exerciseName}>
                      <Typography variant="headlineLg">{exerciseName}</Typography>
                      <Ionicons color={colors.graphiteMuted} name="fitness-outline" size={20} />
                    </View>
                  ))
                ) : (
                  <Typography tone="secondary" variant="bodyMd">
                    Instruction-only block. No sets to log.
                  </Typography>
                )}
                {block.prescriptionSummary ? (
                  <Typography tone="secondary" variant="labelSm">
                    {block.prescriptionSummary}
                  </Typography>
                ) : null}
              </View>
            </EditorialCard>
          ))}
        </View>

        {!workoutProgramQuery.isLoading && !workoutProgramQuery.error && !day ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Workout unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The requested day is not present in the published payload.
            </Typography>
            <View className="pt-2">
              <AppButton onPress={() => workoutProgramQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const SignalDayScreen = memo(SignalDayScreenComponent);
