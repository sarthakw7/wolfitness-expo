import type { WorkoutPlanForToday } from "@/src/services/workout.service";

type SignalActiveProgramCandidate = {
  source: string | null;
  source_program_id: string | null;
};

export function isMatchingSignalActiveProgram(
  activeProgram: SignalActiveProgramCandidate | null | undefined,
  workoutPlan: WorkoutPlanForToday,
) {
  return Boolean(
    activeProgram &&
      activeProgram.source === "signal" &&
      activeProgram.source_program_id === workoutPlan.program.id,
  );
}

export function resolveSignalWorkoutSessionKeys(workoutPlan: WorkoutPlanForToday) {
  return {
    dayKey: workoutPlan.source_day_key ?? workoutPlan.day.id,
    weekKey: workoutPlan.source_week_key ?? workoutPlan.week.id,
  };
}

export function logSignalWorkoutValidationIssue(message: string, context: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[signal-workout-session]", message, context);
  }
}
