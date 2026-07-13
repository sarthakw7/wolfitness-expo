import type { WorkoutExercise } from "@/src/services/workout.service";

export function parseTargetReps(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatSignalWorkoutPrescriptionSummary(
  prescription: WorkoutExercise["prescription"] | null | undefined,
) {
  if (!prescription) return null;

  const summary = [
    prescription.target_sets ? `${prescription.target_sets} sets` : null,
    prescription.target_reps ? `${prescription.target_reps} reps` : null,
    prescription.target_rpe ? `RPE ${prescription.target_rpe}` : null,
    prescription.rest_seconds ? `${prescription.rest_seconds}s rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return summary.length > 0 ? summary : null;
}

export function parseSignalFallbackSetCount(exercise: WorkoutExercise | null | undefined) {
  const explicitSets = exercise?.prescription.target_sets ?? 0;
  if (explicitSets > 0) return explicitSets;

  const repsText = exercise?.prescription.target_reps?.trim() ?? "";
  if (!repsText) return 1;

  const xMatch = repsText.match(/(\d+)\s*(?:x|×)\s*(\d+)/i);
  if (xMatch) {
    const parsed = Number(xMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const setsMatch = repsText.match(/(\d+)\s*(?:sets?|rounds?|working sets?)/i);
  if (setsMatch) {
    const parsed = Number(setsMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 1;
}

export function getSignalFallbackReps(exercise: WorkoutExercise | null | undefined) {
  const repsText = exercise?.prescription.target_reps?.trim() ?? "";
  if (!repsText) return null;

  const xMatch = repsText.match(/(\d+)\s*(?:x|×)\s*(\d+)/i);
  if (xMatch) {
    const parsed = Number(xMatch[2]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return parseTargetReps(repsText);
}

export function getTargetSets(exercise: WorkoutExercise | null | undefined) {
  return parseSignalFallbackSetCount(exercise);
}

export function parsePositiveIntegerLike(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
  }

  if (typeof value !== "string") return null;
  const match = value.trim().match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getSignalPrescribedSetCount(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { sets?: string | number | null } | null | undefined,
) {
  const payloadSets = parsePositiveIntegerLike(payloadExercise?.sets);
  if (payloadSets) return payloadSets;

  const targetSets = getTargetSets(exercise);
  return targetSets > 0 ? targetSets : 1;
}

export function getSignalPrescribedRepsValue(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { reps?: string | null } | null | undefined,
) {
  const payloadReps = typeof payloadExercise?.reps === "string" ? payloadExercise.reps.trim() : "";
  if (payloadReps) return payloadReps;

  const repsFallback = getSignalFallbackReps(exercise);
  return Number.isFinite(repsFallback as number) ? String(repsFallback) : "";
}

export function getSignalPrescribedRpeValue(
  exercise: WorkoutExercise | null | undefined,
  payloadExercise: { rpe?: string | null } | null | undefined,
) {
  const payloadRpe = typeof payloadExercise?.rpe === "string" ? payloadExercise.rpe.trim() : "";
  if (payloadRpe) return payloadRpe;

  const targetRpe = exercise?.prescription.target_rpe;
  if (typeof targetRpe === "number" && Number.isFinite(targetRpe)) return String(targetRpe);
  return "";
}
