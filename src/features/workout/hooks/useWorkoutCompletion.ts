import { useRef } from "react";

import type { ActiveProgramRow, AdvanceActiveProgramInput } from "@/src/services/active-program.service";
import type { WorkoutProgramPayload } from "@/src/services/programs";
import type { SignalWorkoutStep } from "@/src/services/signal-workout-adapter";
import { findNextSignalWorkoutDay } from "@/src/services/signal-workout-adapter";
import type { WorkoutLogSet, WorkoutPlanForToday } from "@/src/features/workout/services/workoutTypes";
import type { WorkoutSummary } from "@/src/features/workout-summary/types";

export type WorkoutCompletionSummary = {
  completedDayTitle: string;
  completedExercises: number;
  completedSets: number;
  completedWeekLabel: string;
  isProgramCompleted: boolean;
  nextWorkout: {
    dayId: string;
    dayLabel: string;
    programId: string;
    weekId: string;
    weekLabel: string;
  } | null;
  progressUpdateNeedsRefresh: boolean;
  programTitle: string;
  summary: WorkoutSummary;
};

type AdvanceActiveProgramAfterWorkoutInput = Omit<AdvanceActiveProgramInput, "userId">;

type UseWorkoutCompletionInput = {
  activeSignalProgram: ActiveProgramRow | null;
  advanceActiveProgramAfterWorkout: (input: AdvanceActiveProgramAfterWorkoutInput) => Promise<unknown>;
  completedExerciseCount: number;
  completionSummary: WorkoutCompletionSummary | null;
  finishWorkoutSession: (sessionId: string) => Promise<unknown>;
  isFinishPending: boolean;
  isSignalExecution: boolean;
  navigateAfterFallbackFinish: () => void;
  normalizedLogs: WorkoutLogSet[];
  refetchSession: () => void;
  refetchWorkout: () => void;
  resetRestTimer: () => void;
  sessionComplete: boolean;
  sessionId: string | null | undefined;
  sessionStartedAt: string | null | undefined;
  setCompletionSummary: (summary: WorkoutCompletionSummary) => void;
  setCurrentStepIndex: (updater: number) => void;
  setFinishError: (error: string | null) => void;
  signalDayId: string | null | undefined;
  signalOrderedSteps: SignalWorkoutStep[];
  signalWeekId: string | null | undefined;
  signalWorkoutPayload: WorkoutProgramPayload | null;
  workoutPlan: WorkoutPlanForToday | null | undefined;
  workoutSummary: WorkoutSummary | null;
};

export function useWorkoutCompletion({
  activeSignalProgram,
  advanceActiveProgramAfterWorkout,
  completedExerciseCount,
  completionSummary,
  finishWorkoutSession,
  isFinishPending,
  isSignalExecution,
  navigateAfterFallbackFinish,
  normalizedLogs,
  refetchSession,
  refetchWorkout,
  resetRestTimer,
  sessionComplete,
  sessionId,
  sessionStartedAt,
  setCompletionSummary,
  setCurrentStepIndex,
  setFinishError,
  signalDayId,
  signalOrderedSteps,
  signalWeekId,
  signalWorkoutPayload,
  workoutPlan,
  workoutSummary,
}: UseWorkoutCompletionInput) {
  const finishLockRef = useRef(false);

  async function finishWorkout() {
    if (!sessionId || isFinishPending || sessionComplete || finishLockRef.current || completionSummary) return;
    setFinishError(null);
    finishLockRef.current = true;
    try {
      const isSignalWorkout = Boolean(isSignalExecution && signalWorkoutPayload && activeSignalProgram);
      const currentWeekLabel = workoutPlan?.week.title ?? signalWorkoutPayload?.weeks.find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)?.title ?? "Workout";
      const currentDayLabel = workoutPlan?.day.title ?? signalWorkoutPayload?.weeks
        .find((week) => week.id === signalWeekId || week.sync_key === signalWeekId)
        ?.days.find((day) => day.id === signalDayId || day.sync_key === signalDayId)?.title ?? "Workout";
      const summary = workoutSummary ?? {
        averageRpe: null,
        completedAt: new Date().toISOString(),
        durationMinutes: null,
        notes: null,
        startedAt: sessionStartedAt ?? new Date().toISOString(),
        totalExercises: completedExerciseCount,
        totalReps: normalizedLogs.reduce((total, log) => total + (log.reps_completed ?? 0), 0),
        totalSets: normalizedLogs.length,
        totalVolumeKg: normalizedLogs.reduce((total, log) => {
          const reps = log.reps_completed ?? 0;
          const weightKg = log.weight_kg ?? 0;
          return total + reps * weightKg;
        }, 0),
        totalWeightMovedKg: normalizedLogs.reduce((total, log) => {
          const reps = log.reps_completed ?? 0;
          const weightKg = log.weight_kg ?? 0;
          return total + reps * weightKg;
        }, 0),
      };
      const summarySnapshot: Omit<WorkoutCompletionSummary, "nextWorkout" | "progressUpdateNeedsRefresh" | "isProgramCompleted"> = {
        completedDayTitle: currentDayLabel,
        completedExercises: summary.totalExercises,
        completedSets: summary.totalSets,
        completedWeekLabel: currentWeekLabel,
        programTitle: workoutPlan?.program.title ?? signalWorkoutPayload?.program.title ?? "Workout",
        summary,
      };

      await finishWorkoutSession(sessionId);

      if (!isSignalWorkout) {
        resetRestTimer();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: false,
          nextWorkout: null,
          progressUpdateNeedsRefresh: false,
        });
        return;
      }

      const nextDay = signalWorkoutPayload
        ? findNextSignalWorkoutDay(signalWorkoutPayload, signalWeekId, signalDayId)
        : { error: "missing_program", isProgramCompleted: false, nextDayKey: null, nextWeekKey: null };
      let nextWorkout: WorkoutCompletionSummary["nextWorkout"] = null;
      let progressUpdateNeedsRefresh = false;

      if (nextDay.error) {
        progressUpdateNeedsRefresh = true;
        console.warn("[athlete-flow]", {
          error: nextDay.error,
          screen: "WorkoutPlayer",
          type: "active-program-advance-validation",
        });
      } else if (!nextDay.isProgramCompleted && nextDay.nextWeekKey && nextDay.nextDayKey && signalWorkoutPayload) {
        const nextWeek = signalWorkoutPayload.weeks.find((week) => week.id === nextDay.nextWeekKey || week.sync_key === nextDay.nextWeekKey);
        const nextDayRow = nextWeek?.days.find((day) => day.id === nextDay.nextDayKey || day.sync_key === nextDay.nextDayKey);
        if (!nextWeek || !nextDayRow) {
          progressUpdateNeedsRefresh = true;
        } else {
          nextWorkout = {
            dayId: nextDay.nextDayKey,
            dayLabel: nextDayRow.title,
            programId: signalWorkoutPayload.program.id,
            weekId: nextDay.nextWeekKey,
            weekLabel: nextWeek.title,
          };
        }
      }

      if (isSignalExecution && signalWorkoutPayload && activeSignalProgram) {
        if (!nextDay.error) {
          try {
            await advanceActiveProgramAfterWorkout({
              activeProgramId: activeSignalProgram.id,
              completedSessionId: sessionId,
              isProgramCompleted: nextDay.isProgramCompleted,
              nextDayKey: nextDay.nextDayKey,
              nextWeekKey: nextDay.nextWeekKey,
            });
          } catch (error) {
            progressUpdateNeedsRefresh = true;
            console.warn("[athlete-flow]", {
              error: error instanceof Error ? error.message : String(error),
              screen: "WorkoutPlayer",
              type: "active-program-advance",
            });
          }
        }

        resetRestTimer();
        setCompletionSummary({
          ...summarySnapshot,
          isProgramCompleted: nextDay.isProgramCompleted,
          nextWorkout,
          progressUpdateNeedsRefresh,
        });
        const summaryStepIndex = signalOrderedSteps.findIndex((step) => step.type === "summary");
        if (summaryStepIndex >= 0) {
          setCurrentStepIndex(summaryStepIndex);
        }
        return;
      }

      resetRestTimer();
      await new Promise((resolve) => setTimeout(resolve, 750));
      navigateAfterFallbackFinish();
    } catch (error) {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "WorkoutPlayer",
        type: "finish-workout-action",
      });
      refetchWorkout();
      refetchSession();
      setFinishError(error instanceof Error ? error.message : "Unable to finish workout.");
      finishLockRef.current = false;
    }
  }

  return {
    finishWorkout,
    isFinishing: isFinishPending,
    isFinishLocked: () => finishLockRef.current,
  };
}
