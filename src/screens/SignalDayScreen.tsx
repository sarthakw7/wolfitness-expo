import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo, useMemo } from "react";
import { ScrollView, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import type { WorkoutProgramPayloadBlock, WorkoutProgramPayloadDay, WorkoutProgramPayloadWeek } from "@/src/services/programs";
import { colors } from "@/src/theme";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function findWeek(weeks: WorkoutProgramPayloadWeek[], weekKey: string | null) {
  if (!weekKey) return null;
  return weeks.find((week) => week.id === weekKey || week.sync_key === weekKey) ?? null;
}

function findDay(week: WorkoutProgramPayloadWeek | null, dayKey: string | null) {
  if (!week || !dayKey) return null;
  return week.days.find((day) => day.id === dayKey || day.sync_key === dayKey) ?? null;
}

function countExercisesInBlock(block: WorkoutProgramPayloadBlock) {
  return block.exercises.length;
}

function renderMediaLabel(media: string) {
  try {
    const url = new URL(media);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return media;
  }
}

function SignalDayScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string; weekId?: string; dayId?: string }>();
  const programId = singleParam(params.programId);
  const weekId = singleParam(params.weekId);
  const dayId = singleParam(params.dayId);
  const workoutProgramQuery = useWorkoutProgram(programId);

  const week = useMemo(
    () => findWeek(workoutProgramQuery.data?.weeks ?? [], weekId),
    [weekId, workoutProgramQuery.data?.weeks],
  );
  const day = useMemo(() => findDay(week, dayId), [dayId, week]);
  const program = workoutProgramQuery.data?.program ?? null;

  const notFound = workoutProgramQuery.error instanceof Error && (workoutProgramQuery.error as { code?: string }).code === "NOT_FOUND";

  return (
    <ScreenScaffold
      bottomChrome="none"
      contentClassName="gap-6"
      header={<AppTopBar back subtitle="Signal Day" title={day?.title ?? "Day"} />}
    >
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-2 pb-8">
        {workoutProgramQuery.isLoading ? <EditorialCard className="min-h-48 bg-surface-muted" /> : null}

        {workoutProgramQuery.error && !notFound ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load day</Typography>
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

        {day ? (
          <EditorialCard className="gap-4">
            <View className="gap-2">
              <Typography tone="secondary" variant="labelSm">
                DAY
              </Typography>
              <Typography variant="displayLg">{day.title}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {program?.title ?? "Published Signal workout"}
              </Typography>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <Typography tone="secondary" variant="labelSm">
                Blocks {day.blocks.length}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Exercises {day.blocks.reduce((sum, block) => sum + countExercisesInBlock(block), 0)}
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Sync {day.sync_key}
              </Typography>
            </View>
          </EditorialCard>
        ) : null}

        <View className="gap-4">
          {(day?.blocks ?? []).map((block) => (
            <EditorialCard className="gap-4" key={block.sync_key}>
              <View className="flex-row items-start justify-between gap-3">
                <View className="gap-1">
                  <Typography variant="headlineXl">{block.title}</Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    {block.description ?? "No block description."}
                  </Typography>
                </View>
                <View className="items-end gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    {block.exercises.length} exercise{block.exercises.length === 1 ? "" : "s"}
                  </Typography>
                  <Typography tone="secondary" variant="labelSm">
                    Sync {block.sync_key}
                  </Typography>
                </View>
              </View>

              <View className="gap-3 border-t border-border pt-4">
                {block.exercises.map((exercise, index) => (
                  <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4" key={exercise.sync_key}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 gap-1">
                        <View className="flex-row items-center gap-2">
                          <Typography tone="secondary" variant="labelSm">
                            {index + 1}
                          </Typography>
                          <Typography variant="headlineLg">{exercise.exerciseName}</Typography>
                        </View>
                        <Typography tone="secondary" variant="bodyMd">
                          {exercise.notes || "No notes provided."}
                        </Typography>
                      </View>
                      <Ionicons color={colors.graphiteMuted} name="fitness-outline" size={20} />
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      <Typography tone="secondary" variant="labelSm">
                        Sets {exercise.sets}
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        Reps {exercise.reps}
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        Rest {exercise.rest}
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        RPE {exercise.rpe}
                      </Typography>
                    </View>

                    <View className="flex-row flex-wrap gap-2">
                      <Typography tone="secondary" variant="labelSm">
                        Media {exercise.media.length}
                      </Typography>
                      <Typography tone="secondary" variant="labelSm">
                        Sync {exercise.sync_key}
                      </Typography>
                    </View>

                    {exercise.media.length > 0 ? (
                      <View className="gap-2 border-t border-border pt-3">
                        <Typography tone="secondary" variant="labelSm">
                          Media
                        </Typography>
                        <View className="gap-2">
                          {exercise.media.map((media) => (
                            <View className="rounded-xl border border-border bg-background/60 px-3 py-2" key={media}>
                              <Typography variant="bodyMd">{renderMediaLabel(media)}</Typography>
                              <Typography tone="secondary" variant="labelSm">
                                {media}
                              </Typography>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </EditorialCard>
          ))}
        </View>

        {!workoutProgramQuery.isLoading && !workoutProgramQuery.error && !day ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Day not found</Typography>
            <Typography tone="secondary" variant="bodyMd">
              The requested day is not present in the published payload.
            </Typography>
          </EditorialCard>
        ) : null}
      </ScrollView>
    </ScreenScaffold>
  );
}

export const SignalDayScreen = memo(SignalDayScreenComponent);
