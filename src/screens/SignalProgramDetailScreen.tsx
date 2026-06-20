import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import type { WorkoutProgramPayloadDay, WorkoutProgramPayloadWeek } from "@/src/services/programs";
import { colors } from "@/src/theme";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function countExercisesInWeek(week: WorkoutProgramPayloadWeek) {
  return week.days.reduce((dayTotal, day) => dayTotal + day.blocks.reduce((blockTotal, block) => blockTotal + block.exercises.length, 0), 0);
}

function countDaysInWeek(week: WorkoutProgramPayloadWeek) {
  return week.days.length;
}

function SignalProgramDetailScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programId = singleParam(params.programId);
  const workoutProgramQuery = useWorkoutProgram(programId);
  const program = workoutProgramQuery.data?.program ?? null;
  const weeks = workoutProgramQuery.data?.weeks ?? [];

  const totalDays = useMemo(() => weeks.reduce((sum, week) => sum + countDaysInWeek(week), 0), [weeks]);
  const totalExercises = useMemo(
    () =>
      weeks.reduce((sum, week) => sum + countExercisesInWeek(week), 0),
    [weeks],
  );

  const notFound = workoutProgramQuery.error instanceof Error && (workoutProgramQuery.error as { code?: string }).code === "NOT_FOUND";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Program" title={program?.title ?? "Program"} />}
    >
      <View className="gap-4 px-2">
        {workoutProgramQuery.isLoading ? <EditorialCard className="min-h-52 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !notFound ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load program</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The published workout payload could not be loaded.
            </Typography>
          </EditorialCard>
        ) : null}

        {notFound ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Published program not found</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This program does not have a published workout payload yet.
            </Typography>
          </EditorialCard>
        ) : null}

        {program ? (
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

            <View className="flex-row flex-wrap gap-2">
              <Typography tone="secondary" variant="labelSm">
                {program.duration}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                {program.difficulty}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                {program.goal}
              </Typography>
            </View>

            <View className="flex-row flex-wrap gap-3 border-t border-border pt-4">
              <Typography tone="secondary" variant="labelSm">
                Weeks {weeks.length}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Days {totalDays}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Exercises {totalExercises}
              </Typography>
            </View>
          </EditorialCard>
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
                      Days {countDaysInWeek(week)}
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
            <Typography variant="headlineLg">No weeks in this program</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The published payload is empty.
            </Typography>
          </EditorialCard>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const SignalProgramDetailScreen = memo(SignalProgramDetailScreenComponent);

export type { WorkoutProgramPayloadDay };
