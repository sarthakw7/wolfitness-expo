import type { WorkoutExercise, WorkoutLogSet } from "@/src/services/workout.service";

export function buildWorkoutLogKey(exerciseIdentityKey: string, setNumber: number) {
  return `${exerciseIdentityKey}:${setNumber}`;
}

export function getWorkoutExerciseIdentityKey(exercise: WorkoutExercise) {
  return exercise.source_exercise_key ?? exercise.exercise.id;
}

export function getWorkoutLogIdentityKey(log: Pick<WorkoutLogSet, "exercise_library_id" | "source_exercise_key">) {
  return log.source_exercise_key ?? log.exercise_library_id ?? "";
}
