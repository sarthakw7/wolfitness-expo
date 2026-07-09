import { Link, router } from "expo-router";
import { memo, useEffect } from "react";
import { Pressable, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useWorkoutHistory } from "@/src/hooks/queries";
import { formatSummaryLine } from "@/src/features/workout-summary/lib/formatWorkoutSummary";

function formatCompletedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently completed";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStartedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Started recently";

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function WorkoutHistoryScreenComponent() {
  const workoutHistoryQuery = useWorkoutHistory();

  useEffect(() => {
    if (!workoutHistoryQuery.error) return;

    console.warn("[athlete-flow]", {
      error: workoutHistoryQuery.error instanceof Error ? workoutHistoryQuery.error.message : String(workoutHistoryQuery.error),
      screen: "WorkoutHistory",
      type: "workout-history",
    });
  }, [workoutHistoryQuery.error]);

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar back title="Workout History" />}>
      <View className="gap-6 px-2">
        <View className="gap-2">
          <Typography variant="displayLg">Completed Workouts</Typography>
          <Typography tone="secondary" variant="bodyLg">
            Review your recent finished sessions across Signal and legacy programs.
          </Typography>
        </View>

        {workoutHistoryQuery.isLoading ? (
          <View className="gap-gutter">
            <EditorialCard className="min-h-32 bg-surface-muted" />
            <EditorialCard className="min-h-32 bg-surface-muted" />
            <EditorialCard className="min-h-32 bg-surface-muted" />
          </View>
        ) : null}

        {workoutHistoryQuery.error ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load workout history</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please retry in a moment.
            </Typography>
            <AppButton onPress={() => workoutHistoryQuery.refetch()} variant="secondary">
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {!workoutHistoryQuery.isLoading && !workoutHistoryQuery.error && workoutHistoryQuery.data?.length === 0 ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No completed workouts yet</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Finish your first workout to start building history.
            </Typography>
            <Link href="/(marketplace)" asChild>
              <AppButton variant="secondary">Browse Programs</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        {!workoutHistoryQuery.isLoading && !workoutHistoryQuery.error && (workoutHistoryQuery.data?.length ?? 0) > 0 ? (
          <View className="gap-gutter">
            {workoutHistoryQuery.data?.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/(tabs)/history/${session.id}` as never)}
              >
                <EditorialCard className="gap-4">
                  <View className="gap-1">
                    <Typography tone="secondary" variant="labelSm">
                      {session.source === "signal" ? "SIGNAL WORKOUT" : "LEGACY WORKOUT"}
                    </Typography>
                    <Typography variant="headlineLg">{session.title}</Typography>
                    <Typography tone="secondary" variant="bodyMd">
                      {session.subtitle}
                    </Typography>
                    <Typography tone="secondary" variant="labelSm">
                      {formatSummaryLine(session.summary)}
                    </Typography>
                  </View>

                  <View className="flex-row flex-wrap gap-4">
                    <View className="gap-1">
                      <Typography tone="secondary" variant="labelSm">
                        Completed
                      </Typography>
                      <Typography variant="bodyMd">{formatCompletedAt(session.completedAt)}</Typography>
                    </View>
                    <View className="gap-1">
                      <Typography tone="secondary" variant="labelSm">
                        Started
                      </Typography>
                      <Typography variant="bodyMd">{formatStartedAt(session.startedAt)}</Typography>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-6">
                    <View className="gap-1">
                      <Typography tone="secondary" variant="labelSm">
                        Sets
                      </Typography>
                      <Typography variant="headlineLg">{session.setCount}</Typography>
                    </View>
                    <View className="gap-1">
                      <Typography tone="secondary" variant="labelSm">
                        Exercises
                      </Typography>
                      <Typography variant="headlineLg">{session.exerciseCount}</Typography>
                    </View>
                  </View>

                  <Typography tone="secondary" variant="bodyMd">
                    {session.programLabel}
                  </Typography>
                </EditorialCard>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const WorkoutHistoryScreen = memo(WorkoutHistoryScreenComponent);
