import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { ImageBackground, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { useCompleteSet, useFinishWorkout } from "@/src/hooks/mutations";
import { useEnrollments, useWorkout, useWorkoutSession } from "@/src/hooks/queries";
import type { WorkoutExercise } from "@/src/services/workout.service";
import { colors } from "@/src/theme";

function parseTargetReps(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDurationWeeks(weeks: number | null | undefined) {
  if (!weeks || weeks <= 0) return "Flexible";
  return `${weeks} Weeks`;
}

function formatRest(remainingSec: number) {
  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function WorkoutSkeleton() {
  return (
    <View className="gap-gutter">
      <EditorialCard className="min-h-44 bg-surface-muted" />
      <EditorialCard className="min-h-40 bg-surface-muted" />
      <EditorialCard className="min-h-56 bg-surface-muted" />
    </View>
  );
}

function SetRow({
  completed,
  index,
  repsLabel,
}: {
  completed: boolean;
  index: number;
  repsLabel: string;
}) {
  return (
    <GlassCard className={completed ? "border-emerald/50 bg-emerald/10" : "border-border bg-surface"}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <Typography variant="headlineLg">{index}</Typography>
          <Chip label={completed ? "Completed" : "Pending"} />
        </View>
        <View className="flex-row items-center gap-4">
          <Typography tone="secondary" variant="bodyMd">
            {repsLabel}
          </Typography>
          <View
            className={
              completed
                ? "h-8 w-8 items-center justify-center rounded-full bg-emerald"
                : "h-8 w-8 items-center justify-center rounded-full border border-border"
            }
          >
            <Ionicons color={completed ? colors.white : colors.graphiteSubtle} name="checkmark" size={16} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function WorkoutPlayerScreenComponent() {
  const enrollmentsQuery = useEnrollments();
  const workoutQuery = useWorkout();
  const workoutPlan = workoutQuery.data ?? null;
  const {
    clearRestTimer,
    remainingRestSec,
    sessionId,
    sessionQuery,
    startSession,
    startSessionMutation,
    startRestTimer,
  } = useWorkoutSession(workoutPlan);

  const completeSetMutation = useCompleteSet();
  const finishWorkoutMutation = useFinishWorkout();

  useEffect(() => {
    const failures = [
      ["enrollments", enrollmentsQuery.error],
      ["workout", workoutQuery.error],
      ["workout-session", sessionQuery.error],
      ["start-session", startSessionMutation.error],
      ["complete-set", completeSetMutation.error],
      ["finish-workout", finishWorkoutMutation.error],
    ].filter(([, error]) => Boolean(error));

    failures.forEach(([type, error]) => {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type,
      });
    });
  }, [
    completeSetMutation.error,
    enrollmentsQuery.error,
    finishWorkoutMutation.error,
    sessionQuery.error,
    startSessionMutation.error,
    workoutQuery.error,
  ]);

  const isLoading =
    enrollmentsQuery.isLoading ||
    workoutQuery.isLoading ||
    (workoutPlan ? sessionQuery.isLoading : false);
  const hasError = Boolean(enrollmentsQuery.error || workoutQuery.error || sessionQuery.error);
  const activeEnrollment = useMemo(() => {
    return (enrollmentsQuery.data ?? []).find((enrollment) => enrollment.status === "active") ?? null;
  }, [enrollmentsQuery.data]);

  const logs = useMemo(() => sessionQuery.data?.logs ?? [], [sessionQuery.data?.logs]);
  const exerciseProgress = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      const current = map.get(log.exercise_library_id) ?? 0;
      map.set(log.exercise_library_id, Math.max(current, log.set_number));
    });
    return map;
  }, [logs]);

  const currentExerciseIndex = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return 0;
    return workoutPlan.exercises.findIndex((item) => {
      const completed = exerciseProgress.get(item.exercise.id) ?? 0;
      const target = item.prescription.target_sets ?? 0;
      return completed < target;
    });
  }, [exerciseProgress, workoutPlan?.exercises]);

  const safeExerciseIndex =
    currentExerciseIndex >= 0
      ? currentExerciseIndex
      : Math.max(0, (workoutPlan?.exercises?.length ?? 1) - 1);

  const activeExercise: WorkoutExercise | null =
    workoutPlan?.exercises?.[safeExerciseIndex] ?? null;

  const completedSetsForActive = activeExercise
    ? exerciseProgress.get(activeExercise.exercise.id) ?? 0
    : 0;
  const targetSetsForActive = activeExercise?.prescription.target_sets ?? 0;
  const isActiveExerciseComplete =
    targetSetsForActive > 0 && completedSetsForActive >= targetSetsForActive;
  const nextSetNumber = Math.min(completedSetsForActive + 1, Math.max(1, targetSetsForActive));

  const repsForLog = parseTargetReps(activeExercise?.prescription.target_reps ?? null);

  const sessionComplete = Boolean(sessionQuery.data?.session.completed_at);
  const hasStartedSession = Boolean(sessionId);
  const disableCompleteSet =
    !sessionId ||
    !activeExercise ||
    targetSetsForActive === 0 ||
    isActiveExerciseComplete ||
    completeSetMutation.isPending ||
    sessionComplete;

  const allExercisesComplete = useMemo(() => {
    if (!workoutPlan?.exercises?.length) return false;
    return workoutPlan.exercises.every((item) => {
      const completed = exerciseProgress.get(item.exercise.id) ?? 0;
      const target = item.prescription.target_sets ?? 0;
      return target > 0 && completed >= target;
    });
  }, [exerciseProgress, workoutPlan?.exercises]);

  const handleCompleteSet = async () => {
    if (!sessionId || !activeExercise || disableCompleteSet) return;
    try {
      await completeSetMutation.mutateAsync({
        exerciseLibraryId: activeExercise.exercise.id,
        repsCompleted: repsForLog,
        sessionId,
        setNumber: nextSetNumber,
        weightKg: null,
      });
      const restSeconds = activeExercise.prescription.rest_seconds ?? 90;
      if (restSeconds > 0) {
        await startRestTimer(restSeconds);
      }
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "complete-set-action",
      });
      sessionQuery.refetch();
    }
  };

  const handleStartWorkout = async () => {
    if (startSessionMutation.isPending || sessionId) return;
    try {
      await startSession();
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "start-session-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
    }
  };

  const handleFinishWorkout = async () => {
    if (!sessionId || finishWorkoutMutation.isPending || sessionComplete) return;
    try {
      await finishWorkoutMutation.mutateAsync(sessionId);
      await clearRestTimer();
      await new Promise((resolve) => setTimeout(resolve, 750));
      router.replace("/(tabs)");
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "finish-workout-action",
      });
      workoutQuery.refetch();
      sessionQuery.refetch();
    }
  };

  return (
    <ScreenScaffold
      header={
        <AppTopBar
          centered
          subtitle={workoutPlan?.program.title ?? "Workout"}
          taskMode
          title={
            workoutPlan?.exercises?.length
              ? `${safeExerciseIndex + 1} of ${workoutPlan.exercises.length} Exercises`
              : "Workout"
          }
        />
      }
      taskMode
    >
      {hasError ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Unable to load workout</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
          <AppButton onPress={() => {
            enrollmentsQuery.refetch();
            workoutQuery.refetch();
            sessionQuery.refetch();
          }} variant="secondary">
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

      {isLoading ? <WorkoutSkeleton /> : null}

      {!isLoading && !hasError && !activeEnrollment ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">No active program</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Start a training protocol before opening workout execution.
          </Typography>
          <Link asChild href="/(marketplace)">
            <AppButton variant="secondary">Explore Programs</AppButton>
          </Link>
        </EditorialCard>
      ) : null}

      {!isLoading && !hasError && activeEnrollment && !workoutPlan ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">No active workout today</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Your active protocol does not have a recoverable plan for today. It may be unpublished or missing today’s training day.
          </Typography>
          <View className="gap-2">
            <AppButton
              onPress={() => {
                workoutQuery.refetch();
                enrollmentsQuery.refetch();
              }}
              variant="secondary"
            >
              Retry
            </AppButton>
            <Link asChild href="/(marketplace)">
              <AppButton variant="ghost">Browse Training</AppButton>
            </Link>
          </View>
        </EditorialCard>
      ) : null}

      {!isLoading && !hasError && workoutPlan && workoutPlan.exercises.length === 0 ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">No exercises for this day</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This training day has no programmed exercises yet.
          </Typography>
          <Link asChild href="/(marketplace)">
            <AppButton variant="secondary">Browse Training</AppButton>
          </Link>
        </EditorialCard>
      ) : null}

      {!isLoading && !hasError && workoutPlan && workoutPlan.exercises.length > 0 && !activeExercise ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Workout changed</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This exercise is no longer available in the current program. Reload the workout to recover.
          </Typography>
          <AppButton onPress={() => workoutQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

      {!isLoading && !hasError && workoutPlan && workoutPlan.exercises.length > 0 && activeExercise ? (
        <View className="gap-gutter">
          <View className="aspect-[4/3] overflow-hidden rounded-3xl bg-surface-muted">
            <ImageBackground
              accessibilityLabel="Exercise demonstration"
              source={{
                uri:
                  activeExercise.exercise.video_url ??
                  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1200&auto=format&fit=crop",
              }}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <View className="flex-1 items-center justify-center bg-black/10">
                <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/80">
                  <Ionicons color={colors.graphite} name="play" size={30} />
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="gap-3">
            <View className="flex-row gap-2">
              <Chip label={activeExercise.exercise.primary_muscle ?? "Primary"} />
              <Chip label={formatDurationWeeks(workoutPlan.program.duration_weeks)} />
            </View>
            <Typography variant="displayLg">{activeExercise.exercise.name}</Typography>
            <Typography tone="secondary" variant="bodyLg">
              {activeExercise.prescription.notes ?? "Maintain control and execute each rep with intent."}
            </Typography>
          </View>

          <GlassCard className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-emerald">
                <Ionicons color={colors.emerald} name="timer-outline" size={22} />
              </View>
              <View>
                <Typography tone="secondary" variant="labelSm">
                  Rest Timer
                </Typography>
                <Typography variant="headlineXl">{formatRest(remainingRestSec)}</Typography>
              </View>
            </View>
            <AppButton onPress={() => clearRestTimer()} size="sm" variant="ghost">
              Skip Rest
            </AppButton>
          </GlassCard>

          {!hasStartedSession ? (
            <EditorialCard className="gap-3">
              <Typography variant="headlineLg">Ready to train</Typography>
              <Typography tone="secondary" variant="bodyMd">
                Start this workout when you are ready to log sets.
              </Typography>
              <AppButton
                isLoading={startSessionMutation.isPending}
                onPress={handleStartWorkout}
                variant="secondary"
              >
                Start Workout
              </AppButton>
            </EditorialCard>
          ) : (
            <EditorialCard className="gap-3">
              <View className="flex-row items-end justify-between border-b border-border pb-2">
                <Typography variant="headlineLg">Target Sets</Typography>
                <Typography tone="secondary" variant="labelSm">
                  {activeExercise.prescription.target_reps ?? "-- reps"}
                </Typography>
              </View>
              {Array.from({ length: Math.max(0, targetSetsForActive) }).map((_, index) => {
                const setNo = index + 1;
                return (
                  <SetRow
                    completed={setNo <= completedSetsForActive}
                    index={setNo}
                    key={setNo}
                    repsLabel={activeExercise.prescription.target_reps ?? "--"}
                  />
                );
              })}
              <AppButton
                disabled={disableCompleteSet}
                isLoading={completeSetMutation.isPending}
                onPress={handleCompleteSet}
                variant="secondary"
              >
                {isActiveExerciseComplete ? "Exercise Complete" : "Complete Set"}
              </AppButton>
            </EditorialCard>
          )}

          {hasStartedSession ? (
            <AppButton
              disabled={!allExercisesComplete || sessionComplete}
              isLoading={finishWorkoutMutation.isPending}
              onPress={handleFinishWorkout}
              variant={allExercisesComplete ? "primary" : "ghost"}
            >
              {sessionComplete ? "Workout Completed" : "Finish Workout"}
            </AppButton>
          ) : null}

          {sessionComplete ? (
            <AppButton
              onPress={() => router.push("/(tabs)")}
              variant="secondary"
            >
              Back to Dashboard
            </AppButton>
          ) : null}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

export const WorkoutPlayerScreen = memo(WorkoutPlayerScreenComponent);
