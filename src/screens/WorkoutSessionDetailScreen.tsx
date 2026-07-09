import { memo, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { WorkoutSummaryCard } from "@/src/features/workout-summary/components/WorkoutSummaryCard";
import { useWorkoutSessionDetail } from "@/src/hooks/queries";

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null) {
  if (!minutes || minutes <= 0) return "Unavailable";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes}m`;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatWeight(weightKg: number | null) {
  if (weightKg == null) return "--";
  return `${Math.round(weightKg * 10) / 10} kg`;
}

function WorkoutSessionDetailScreenComponent() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = singleParam(params.sessionId);
  const workoutSessionDetailQuery = useWorkoutSessionDetail(sessionId);

  useEffect(() => {
    if (!workoutSessionDetailQuery.error) return;

    console.warn("[athlete-flow]", {
      error:
        workoutSessionDetailQuery.error instanceof Error
          ? workoutSessionDetailQuery.error.message
          : String(workoutSessionDetailQuery.error),
      screen: "WorkoutSessionDetail",
      type: "workout-session-detail",
    });
  }, [workoutSessionDetailQuery.error]);

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar back title="Workout Session" />}>
      <View className="gap-6 px-2">
        {!sessionId ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Invalid workout session</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This session detail link is missing a session id.
            </Typography>
          </EditorialCard>
        ) : null}

        {workoutSessionDetailQuery.isLoading ? (
          <View className="gap-gutter">
            <EditorialCard className="min-h-40 bg-surface-muted" />
            <EditorialCard className="min-h-32 bg-surface-muted" />
            <EditorialCard className="min-h-48 bg-surface-muted" />
          </View>
        ) : null}

        {workoutSessionDetailQuery.error ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load workout session</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please retry in a moment.
            </Typography>
            <AppButton onPress={() => workoutSessionDetailQuery.refetch()} variant="secondary">
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {!workoutSessionDetailQuery.isLoading && !workoutSessionDetailQuery.error && !workoutSessionDetailQuery.data ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Workout session unavailable</Typography>
            <Typography tone="secondary" variant="bodyMd">
              This completed session could not be found for your account.
            </Typography>
          </EditorialCard>
        ) : null}

        {!workoutSessionDetailQuery.isLoading && !workoutSessionDetailQuery.error && workoutSessionDetailQuery.data ? (
          <>
            <EditorialCard className="gap-4">
              <View className="gap-2">
                <Typography tone="secondary" variant="labelSm">
                  {workoutSessionDetailQuery.data.source === "signal" ? "SIGNAL WORKOUT" : "LEGACY WORKOUT"}
                </Typography>
                <Typography variant="displayLg">{workoutSessionDetailQuery.data.title}</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {workoutSessionDetailQuery.data.dayLabel}
                </Typography>
              </View>

              <View className="flex-row flex-wrap gap-4">
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    Completed
                  </Typography>
                  <Typography variant="bodyMd">
                    {formatDateTime(workoutSessionDetailQuery.data.completedAt)}
                  </Typography>
                </View>
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    Duration
                  </Typography>
                  <Typography variant="bodyMd">
                    {formatDuration(workoutSessionDetailQuery.data.durationMinutes)}
                  </Typography>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-6">
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    Exercises
                  </Typography>
                  <Typography variant="headlineLg">{workoutSessionDetailQuery.data.exerciseCount}</Typography>
                </View>
                <View className="gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    Sets
                  </Typography>
                  <Typography variant="headlineLg">{workoutSessionDetailQuery.data.setCount}</Typography>
                </View>
              </View>
            </EditorialCard>

            <WorkoutSummaryCard summary={workoutSessionDetailQuery.data.summary} />

            {workoutSessionDetailQuery.data.groupedExercises.length === 0 ? (
              <EditorialCard className="gap-3">
                <Typography variant="headlineLg">No set logs recorded</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  This session finished without any logged sets.
                </Typography>
              </EditorialCard>
            ) : (
              <View className="gap-gutter">
                {workoutSessionDetailQuery.data.groupedExercises.map((exercise) => (
                  <EditorialCard className="gap-4" key={exercise.exerciseId}>
                    <View className="gap-1">
                      <Typography variant="headlineLg">{exercise.exerciseLabel}</Typography>
                      <Typography tone="secondary" variant="labelSm">
                        {exercise.sets.length} set{exercise.sets.length === 1 ? "" : "s"}
                      </Typography>
                    </View>

                    <View className="gap-3">
                      {exercise.sets.map((set) => (
                        <View className="rounded-2xl border border-border bg-surface-muted p-4" key={set.id}>
                          <View className="flex-row flex-wrap items-center justify-between gap-3">
                            <Typography variant="headlineLg">Set {set.setNumber}</Typography>
                            <Typography tone="secondary" variant="labelSm">
                              {formatDateTime(set.loggedAt)}
                            </Typography>
                          </View>
                          <View className="mt-3 flex-row flex-wrap gap-4">
                            <View className="gap-1">
                              <Typography tone="secondary" variant="labelSm">
                                Reps
                              </Typography>
                              <Typography variant="bodyMd">{set.repsCompleted ?? "--"}</Typography>
                            </View>
                            <View className="gap-1">
                              <Typography tone="secondary" variant="labelSm">
                                Weight
                              </Typography>
                              <Typography variant="bodyMd">{formatWeight(set.weightKg)}</Typography>
                            </View>
                            <View className="gap-1">
                              <Typography tone="secondary" variant="labelSm">
                                RPE
                              </Typography>
                              <Typography variant="bodyMd">{set.rpeActual ?? "--"}</Typography>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </EditorialCard>
                ))}
              </View>
            )}
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const WorkoutSessionDetailScreen = memo(WorkoutSessionDetailScreenComponent);
