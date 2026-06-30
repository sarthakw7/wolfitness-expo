import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams, type Href } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Alert, Pressable, RefreshControl, View } from "react-native";
import { useAuth } from "@/src/hooks/useAuth";
import { useActiveProgram } from "@/src/hooks/queries/useActiveProgram";
import { useStartSignalProgram } from "@/src/hooks/mutations/useStartSignalProgram";

import { AppTopBar, EditorialCard, ProgressBar, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import { getSignalProgramOverview, resolveSignalWorkoutSelection } from "@/src/services/signal-workout-adapter";
import type { WorkoutProgramPayloadDay, WorkoutProgramPayloadWeek } from "@/src/services/programs";
import { colors } from "@/src/theme";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getProgramsErrorCode(error: unknown) {
  return error instanceof Error ? (error as { code?: string }).code ?? null : null;
}

function countExercisesInDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.reduce((blockTotal, block) => blockTotal + block.exercises.length, 0);
}

function countExercisesInWeek(week: WorkoutProgramPayloadWeek) {
  return week.days.reduce((dayTotal, day) => dayTotal + countExercisesInDay(day), 0);
}

function formatAverageWorkoutsPerWeek(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 / week";
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} / week`;
}

function findFirstPlayableSignalSelection(weeks: WorkoutProgramPayloadWeek[]) {
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.blocks.some((block) => block.exercises.length > 0)) {
        return {
          dayKey: day.sync_key,
          weekKey: week.sync_key,
        };
      }
    }
  }

  return null;
}

function SignalProgramDetailScreenComponent() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = singleParam(params.programId);
  const workoutProgramQuery = useWorkoutProgram(programId);
  const activeProgramQuery = useActiveProgram(user?.id);
  const startSignalProgramMutation = useStartSignalProgram();
  const program = workoutProgramQuery.data?.program ?? null;
  const weeks = useMemo(() => workoutProgramQuery.data?.weeks ?? [], [workoutProgramQuery.data?.weeks]);
  const isRefreshing = workoutProgramQuery.isFetching;
  const invalidRoute = !programId;
  const firstPlayableSelection = useMemo(() => findFirstPlayableSignalSelection(weeks), [weeks]);
  const activeProgram = activeProgramQuery.data ?? null;
  const activeProgramSelection = useMemo(() => {
    if (!workoutProgramQuery.data || !activeProgram || activeProgram.source_program_id !== program?.id) return null;
    return resolveSignalWorkoutSelection(workoutProgramQuery.data, {
      dayId: activeProgram.current_day_key,
      weekId: activeProgram.current_week_key,
    });
  }, [activeProgram, program?.id, workoutProgramQuery.data]);

  const isSameActiveProgram =
    Boolean(user?.id) && Boolean(activeProgram && activeProgram.source === "signal" && activeProgram.source_program_id === program?.id);
  const isDifferentActiveProgram =
    Boolean(user?.id) && Boolean(activeProgram && activeProgram.source === "signal" && activeProgram.source_program_id !== program?.id);
  const isActivePointerInvalid = Boolean(
    isSameActiveProgram &&
      (!activeProgram?.current_week_key ||
        !activeProgram?.current_day_key ||
        !activeProgramSelection ||
        activeProgramSelection.status !== "ok"),
  );

  const launchSignalProgram = useCallback(
    async (selection: { dayKey: string; weekKey: string }) => {
      if (!program || !programId || !user?.id) return;
      const launched = await startSignalProgramMutation.mutateAsync({
        firstDayKey: selection.dayKey,
        firstWeekKey: selection.weekKey,
        signalProgramId: program.id,
        signalProgramVersion: null,
      });

      const nextWeekKey = launched.current_week_key ?? selection.weekKey;
      const nextDayKey = launched.current_day_key ?? selection.dayKey;

      router.push({
        pathname: "/(signal)/program/[programId]/week/[weekId]/day/[dayId]",
        params: {
          dayId: nextDayKey,
          programId: programId ?? program.id,
          weekId: nextWeekKey,
        },
      });
    },
    [program, programId, startSignalProgramMutation, user?.id],
  );

  const handlePrimaryCtaPress = useCallback(async () => {
    if (!user?.id || !program || !programId) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (isActivePointerInvalid) {
      return;
    }

    if (isSameActiveProgram && activeProgram?.current_week_key && activeProgram?.current_day_key) {
      router.push({
        pathname: "/(signal)/program/[programId]/week/[weekId]/day/[dayId]",
        params: {
          dayId: activeProgram.current_day_key,
          programId,
          weekId: activeProgram.current_week_key,
        },
      });
      return;
    }

    if (!firstPlayableSelection) return;

    if (isDifferentActiveProgram && activeProgram) {
      Alert.alert(
        "Replace current program?",
        "Starting this Signal program will replace your current active program.",
        [
          { style: "cancel", text: "Cancel" },
          {
            style: "destructive",
            text: "Replace Current Program",
            onPress: () => {
              launchSignalProgram(firstPlayableSelection).catch(() => {});
            },
          },
        ],
      );
      return;
    }

    await launchSignalProgram(firstPlayableSelection);
  }, [
    activeProgram,
    firstPlayableSelection,
    isActivePointerInvalid,
    isDifferentActiveProgram,
    isSameActiveProgram,
    launchSignalProgram,
    program,
    programId,
    user?.id,
  ]);

  const totalDays = useMemo(() => weeks.reduce((sum, week) => sum + week.days.length, 0), [weeks]);
  const overview = useMemo(() => getSignalProgramOverview(workoutProgramQuery.data), [workoutProgramQuery.data]);
  const primaryStats = useMemo(
    () => [
      { label: "Weeks", value: `${overview.totalWeeks}` },
      { label: "Workouts", value: `${overview.totalPlayableWorkouts}` },
      { label: "Cadence", value: formatAverageWorkoutsPerWeek(overview.averageWorkoutsPerWeek) },
      ...(overview.totalExercises > 0 ? [{ label: "Exercises", value: `${overview.totalExercises}` }] : []),
    ],
    [overview.averageWorkoutsPerWeek, overview.totalExercises, overview.totalPlayableWorkouts, overview.totalWeeks],
  );
  const metadataBadges = useMemo(
    () => [overview.difficulty, overview.goal, overview.duration].filter((value): value is string => Boolean(value)),
    [overview.difficulty, overview.duration, overview.goal],
  );

  const errorCode = getProgramsErrorCode(workoutProgramQuery.error);
  const isUnavailableError =
    errorCode === "NOT_FOUND" || errorCode === "PARSE_ERROR" || errorCode === "CONFIGURATION_ERROR" || errorCode === "BAD_REQUEST";
  const ctaUnavailable = !firstPlayableSelection;
  const ctaLabel = !user?.id
    ? "Sign in to start"
    : isActivePointerInvalid
      ? "Program unavailable"
      : isSameActiveProgram
        ? "Continue Program"
    : isDifferentActiveProgram
          ? "Replace Current Program"
          : "Start Program";
  const unavailableLabel = "Program unavailable";
  const resolvedCtaLabel = ctaUnavailable || isActivePointerInvalid ? unavailableLabel : ctaLabel;
  const ctaDisabled =
    !user?.id ||
    !program ||
    ctaUnavailable ||
    isActivePointerInvalid ||
    startSignalProgramMutation.isPending;
  const ctaVariant = isDifferentActiveProgram ? "danger" : "primary";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Program" title={program?.title ?? "Program"} />}
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
              This Signal program link is missing a program id.
            </Typography>
          </EditorialCard>
        ) : null}

        {workoutProgramQuery.isLoading ? <EditorialCard className="min-h-52 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !isUnavailableError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load program</Typography>
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

        {isActivePointerInvalid ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Active program unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
                Your current active Signal program points to a week or day that is no longer available. Refresh the program or replace the current program.
            </Typography>
            <View className="pt-2">
              <AppButton
                onPress={() => {
                  workoutProgramQuery.refetch();
                  activeProgramQuery.refetch();
                }}
                variant="secondary"
              >
                Retry
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {program && !invalidRoute ? (
          <EditorialCard className="gap-4">
            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                PROGRAM OVERVIEW
              </Typography>
              <Typography variant="displayLg">{program.title}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {program.subtitle ?? "No subtitle provided."}
              </Typography>
            </View>

            {metadataBadges.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {metadataBadges.map((badge) => (
                  <View className="rounded-full border border-border bg-surface-muted px-3 py-2" key={badge}>
                    <Typography tone="secondary" variant="labelSm">
                      {badge}
                    </Typography>
                  </View>
                ))}
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-3">
              {primaryStats.map((stat) => (
                <View className="min-w-[45%] flex-1 gap-1 rounded-2xl border border-border bg-surface-muted p-4" key={stat.label}>
                  <Typography tone="secondary" variant="labelSm">
                    {stat.label}
                  </Typography>
                  <Typography variant="headlineLg">{stat.value}</Typography>
                </View>
              ))}
            </View>

            <View className="gap-2 border-t border-border pt-4">
              <View className="flex-row items-center justify-between gap-3">
                <Typography tone="secondary" variant="labelSm">
                  Playable coverage
                </Typography>
                <Typography tone="secondary" variant="labelSm">
                  {overview.totalPlayableWorkouts} of {totalDays} days playable
                </Typography>
              </View>
              <ProgressBar
                className="h-2"
                progress={totalDays > 0 ? overview.totalPlayableWorkouts / totalDays : 0}
                tone="accent"
              />
            </View>
          </EditorialCard>
        ) : null}

        {program && !invalidRoute ? (
          <EditorialCard className="gap-3">
            <Typography tone="secondary" variant="labelSm">
              PROGRAM LIFECYCLE
            </Typography>
            <Typography variant="headlineLg">{resolvedCtaLabel}</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {!user?.id
                ? "Sign in to start this program."
                : isActivePointerInvalid
                  ? "Your active program pointer is invalid. Do not guess a start point."
                  : isSameActiveProgram
                    ? "Continue from your saved Signal week and day."
                    : isDifferentActiveProgram
                      ? "Starting this program will replace your current active program."
                      : "Start this Signal program at the first valid workout."}
            </Typography>
            <View className="pt-2">
              <AppButton disabled={ctaDisabled} isLoading={startSignalProgramMutation.isPending} onPress={handlePrimaryCtaPress} variant={ctaVariant}>
                {resolvedCtaLabel}
              </AppButton>
            </View>
          </EditorialCard>
        ) : null}

        {program && !invalidRoute && overview.topExerciseNames.length > 0 ? (
          <EditorialCard className="gap-4">
            <View className="gap-1">
              <Typography tone="secondary" variant="labelSm">
                WHAT YOU&apos;LL TRAIN
              </Typography>
              <Typography variant="headlineLg">Key exercise focus</Typography>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {overview.topExerciseNames.map((exerciseName) => (
                <View className="rounded-full border border-border bg-surface-muted px-3 py-2" key={exerciseName}>
                  <Typography tone="secondary" variant="labelSm">
                    {exerciseName}
                  </Typography>
                </View>
              ))}
            </View>
          </EditorialCard>
        ) : null}

        {program && !invalidRoute && overview.previewWeeks.length > 0 ? (
          <View className="gap-3">
            <Typography tone="secondary" variant="labelSm">
              WEEK PREVIEW
            </Typography>

            {overview.previewWeeks.map((week) => (
              <EditorialCard className="gap-4" key={week.weekKey}>
                <Link
                  asChild
                  href={{
                    pathname: "/program/[programId]/week/[weekId]",
                    params: {
                      programId: program?.id ?? programId ?? "",
                      weekId: week.weekKey,
                    },
                  } as unknown as Href}
                >
                  <Pressable accessibilityRole="button" className="gap-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="gap-1">
                        <Typography variant="headlineXl">{week.title}</Typography>
                        <Typography tone="secondary" variant="bodyMd">
                          {week.totalPlayableWorkouts} playable workout{week.totalPlayableWorkouts === 1 ? "" : "s"}
                        </Typography>
                      </View>
                      <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={20} />
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      <Typography tone="secondary" variant="labelSm">
                        Days {week.days.length}
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        Exercises {week.totalExerciseCount}
                      </Typography>
                    </View>
                  </Pressable>
                </Link>

                <View className="gap-2 border-t border-border pt-4">
                  {week.days.map((day) => (
                    <Link
                      asChild
                      href={{
                        pathname: "/program/[programId]/week/[weekId]/day/[dayId]",
                        params: {
                          dayId: day.dayKey,
                          programId: program?.id ?? programId ?? "",
                          weekId: week.weekKey,
                        },
                      } as unknown as Href}
                      key={day.dayKey}
                    >
                      <Pressable accessibilityRole="button">
                        <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted p-4">
                          <View className="flex-1 gap-1">
                            <Typography variant="headlineLg">{day.title}</Typography>
                            <Typography tone="secondary" variant="bodyMd">
                              {day.exerciseCount} exercise{day.exerciseCount === 1 ? "" : "s"}
                            </Typography>
                          </View>
                          <View className="items-end gap-2">
                            <Typography tone="secondary" variant="labelSm">
                              {day.isPlayable ? "Playable" : "Unavailable"}
                            </Typography>
                            <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={16} />
                          </View>
                        </View>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              </EditorialCard>
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          {weeks.map((week) => (
            <Link
              asChild
              href={{
                pathname: "/program/[programId]/week/[weekId]",
                params: {
                  programId: program?.id ?? programId ?? "",
                  weekId: week.sync_key,
                },
              } as unknown as Href}
              key={week.sync_key}
            >
              <Pressable accessibilityRole="button">
                <EditorialCard className="gap-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="gap-1">
                      <Typography variant="headlineXl">{week.title}</Typography>
                      <Typography tone="secondary" variant="bodyMd">
                        {week.days.length} day{week.days.length === 1 ? "" : "s"}
                      </Typography>
                    </View>
                    <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={20} />
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <Typography tone="secondary" variant="labelSm">
                      Days {week.days.length}
                    </Typography>
                    <Typography tone="secondary" variant="labelSm">
                      Exercises {countExercisesInWeek(week)}
                    </Typography>
                  </View>
                </EditorialCard>
              </Pressable>
            </Link>
          ))}
        </View>

        {!workoutProgramQuery.isLoading && !workoutProgramQuery.error && weeks.length === 0 ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Workout unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The published workout payload does not contain any weeks yet.
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

export const SignalProgramDetailScreen = memo(SignalProgramDetailScreenComponent);

export type { WorkoutProgramPayloadDay };
