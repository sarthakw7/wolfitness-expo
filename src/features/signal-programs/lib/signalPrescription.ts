import type { WorkoutProgramPayloadExercise } from "@/src/services/programs";

export function compactSignalPrescription(exercise: WorkoutProgramPayloadExercise) {
  return [
    exercise.sets ? `${exercise.sets} sets` : null,
    exercise.reps ? `${exercise.reps} reps` : null,
    exercise.rpe ? `RPE ${exercise.rpe}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatSignalExercisePrescription(exercise: WorkoutProgramPayloadExercise) {
  return compactSignalPrescription(exercise) || null;
}
