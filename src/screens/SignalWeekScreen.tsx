import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useActiveProgram } from "@/src/hooks/queries/useActiveProgram";
import { useSignalProgramProgress } from "@/src/hooks/queries/useSignalProgramProgress";
import { useAuth } from "@/src/hooks/useAuth";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { isSignalPlayableDay } from "@/src/services/signal-workout-adapter";
import type { WorkoutProgramPayloadDay, WorkoutProgramPayloadWeek } from "@/src/services/programs";
import { colors } from "@/src/theme";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function findWeek(weeks: WorkoutProgramPayloadWeek[], weekKey: string | null) {
  if (!weekKey) return null;
  return weeks.find((week) => week.id === weekKey || week.sync_key === weekKey) ?? null;
}

function countExercisesInDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.reduce((sum, block) => sum + block.exercises.length, 0);
}

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

function SignalWeekScreenComponent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ programId?: string; weekId?: string }>();
  const programId = singleParam(params.programId);
  const weekId = singleParam(params.weekId);
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
  const program = workoutProgramQuery.data?.program ?? null;
  const invalidRoute = !programId || !weekId;
  const completedDayKeys = useMemo(() => {
    const sessions = signalProgressQuery.data?.completedSessions ?? [];
    return new Set(
      sessions
        .filter((session) => session.source_program_id === program?.id && session.source_week_key === week?.sync_key)
        .map((session) => session.source_day_key)
        .filter((value): value is string => Boolean(value)),
    );
  }, [program?.id, signalProgressQuery.data?.completedSessions, week?.sync_key]);

  const errorCode = getProgramsErrorCode(workoutProgramQuery.error);
  const isUnavailableError =
    errorCode === "NOT_FOUND" || errorCode === "PARSE_ERROR" || errorCode === "CONFIGURATION_ERROR" || errorCode === "BAD_REQUEST";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Week" title={week?.title ?? "Week"} />}
      refreshControl={
        <RefreshControl
          onRefresh={async () => {
            await workoutProgramQuery.refetch();
          }}
          refreshing={isRefreshing}
        />
      }
    >
      <View className="gap-4 px-2">
        {invalidRoute ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Invalid workout</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This Signal week link is missing a program or week id.
            </Typography>
          </EditorialCard>
        ) : null}

        {workoutProgramQuery.isLoading || activeProgramQuery.isLoading ? <EditorialCard className="min-h-48 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load week</Typography>
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
            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                WEEK
              </Typography>
              <Typography variant="displayLg">{week.title}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {program?.title ?? "Published Signal workout"}
              </Typography>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <Typography tone="secondary" variant="labelSm">
                Days {week.days.length}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Exercises {week.days.reduce((sum, day) => sum + countExercisesInDay(day), 0)}
              </Typography>
            </View>
          </EditorialCard>
        ) : null}

        {week && !invalidRoute ? (
          <EditorialCard className="gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Typography tone="secondary" variant="labelSm">
                  WEEKLY SELECTOR
                </Typography>
                <Typography variant="headlineLg">Choose a training day</Typography>
              </View>
              <Typography tone="secondary" variant="labelSm">
                {week.days.filter((day) => isSignalPlayableDay(day)).length} playable
              </Typography>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pr-2">
                {week.days.map((day, index) => {
                  const isPlayable = isSignalPlayableDay(day);
                  const isCompleted = completedDayKeys.has(day.sync_key);
                  return (
                    <Link
                      asChild
                      href={{
                        pathname: "/program/[programId]/week/[weekId]/day/[dayId]",
                        params: {
                          dayId: day.sync_key,
                          programId: program?.id ?? programId ?? "",
                          weekId: week.sync_key,
                        },
                      } as unknown as Href}
                      key={day.sync_key}
                    >
                      <Pressable
                        accessibilityRole="button"
                        className={`min-w-24 rounded-3xl border p-4 ${
                          isPlayable ? "border-border bg-surface-muted" : "border-border/50 bg-background/40"
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
                          <Typography variant="headlineLg">{day.title}</Typography>
                          <Typography tone="secondary" variant="labelSm">
                            {isPlayable ? `${countExercisesInDay(day)} exercises` : "Rest / unavailable"}
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

        <View className="gap-3">
          {(week?.days ?? []).map((day) => (
            <Link
              asChild
              href={{
                pathname: "/program/[programId]/week/[weekId]/day/[dayId]",
                params: {
                  dayId: day.sync_key,
                  programId: program?.id ?? programId ?? "",
                  weekId: week?.sync_key ?? weekId ?? "",
                },
              } as unknown as Href}
              key={day.sync_key}
            >
              <Pressable accessibilityRole="button">
                <EditorialCard className="gap-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="gap-1">
                      <Typography variant="headlineXl">{day.title}</Typography>
                      <Typography tone="secondary" variant="bodyMd">
                        {day.blocks.length} block{day.blocks.length === 1 ? "" : "s"}
                      </Typography>
                    </View>
                    <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={20} />
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    <Typography tone="secondary" variant="labelSm">
                      Exercises {countExercisesInDay(day)}
                    </Typography>
                    <Typography tone="secondary" variant="labelSm">
                      Sync {day.sync_key}
                    </Typography>
                  </View>
                </EditorialCard>
              </Pressable>
            </Link>
          ))}
        </View>

        {!workoutProgramQuery.isLoading && !workoutProgramQuery.error && !week ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Workout unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The requested week is not present in the published payload.
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

export const SignalWeekScreen = memo(SignalWeekScreenComponent);
