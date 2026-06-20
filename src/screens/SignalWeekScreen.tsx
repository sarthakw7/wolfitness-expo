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

function findWeek(weeks: WorkoutProgramPayloadWeek[], weekKey: string | null) {
  if (!weekKey) return null;
  return weeks.find((week) => week.id === weekKey || week.sync_key === weekKey) ?? null;
}

function countExercisesInDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.reduce((sum, block) => sum + block.exercises.length, 0);
}

function SignalWeekScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string; weekId?: string }>();
  const programId = singleParam(params.programId);
  const weekId = singleParam(params.weekId);
  const workoutProgramQuery = useWorkoutProgram(programId);
  const week = useMemo(
    () => findWeek(workoutProgramQuery.data?.weeks ?? [], weekId),
    [weekId, workoutProgramQuery.data?.weeks],
  );
  const program = workoutProgramQuery.data?.program ?? null;

  const notFound = workoutProgramQuery.error instanceof Error && (workoutProgramQuery.error as { code?: string }).code === "NOT_FOUND";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Week" title={week?.title ?? "Week"} />}
    >
      <View className="gap-4 px-2">
        {workoutProgramQuery.isLoading ? <EditorialCard className="min-h-48 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !notFound ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load week</Typography>
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

        {week ? (
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
            <Typography variant="headlineLg">Week not found</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The requested week is not present in the published payload.
            </Typography>
          </EditorialCard>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const SignalWeekScreen = memo(SignalWeekScreenComponent);
