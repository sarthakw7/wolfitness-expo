import type { WorkoutSummary, WorkoutSummarySessionLike, WorkoutSummarySetLike } from "../types";

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getWorkoutSummaryIdentity(set: WorkoutSummarySetLike) {
  return (
    set.exercise_library_id?.trim() ||
    set.source_exercise_key?.trim() ||
    set.exercise_name?.trim() ||
    set.id.trim()
  );
}

function calculateDurationMinutes(startedAt: string, completedAt: string | null) {
  if (!completedAt) return null;

  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed <= started) return null;

  return Math.round((completed - started) / (1000 * 60));
}

export function calculateWorkoutSummary(
  input: {
    session: WorkoutSummarySessionLike;
    sets: WorkoutSummarySetLike[];
  },
): WorkoutSummary {
  const completedAt = input.session.completed_at ?? null;
  const notes = typeof input.session.notes === "string" && input.session.notes.trim() ? input.session.notes.trim() : null;
  const identities = new Set<string>();
  let totalReps = 0;
  let totalVolumeKg = 0;
  let rpeTotal = 0;
  let rpeCount = 0;

  input.sets.forEach((set) => {
    identities.add(getWorkoutSummaryIdentity(set));

    const reps = safeNumber(set.reps_completed);
    const weightKg = safeNumber(set.weight_kg);
    if (reps !== null) {
      totalReps += reps;
      if (weightKg !== null) {
        totalVolumeKg += reps * weightKg;
      }
    }

    const rpe = safeNumber(set.rpe_actual);
    if (rpe !== null) {
      rpeTotal += rpe;
      rpeCount += 1;
    }
  });

  const averageRpe = rpeCount > 0 ? rpeTotal / rpeCount : null;

  return {
    averageRpe,
    completedAt,
    durationMinutes: calculateDurationMinutes(input.session.started_at, completedAt),
    notes,
    startedAt: input.session.started_at,
    totalExercises: identities.size,
    totalReps,
    totalSets: input.sets.length,
    totalVolumeKg,
    totalWeightMovedKg: totalVolumeKg,
  };
}
