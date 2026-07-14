type SignalWorkoutSubtitleRow = {
  source_day_key: string | null;
  source_week_key: string | null;
};

type WorkoutLogIdentityRow = {
  exercise_library_id: string | null;
  exercise_name: string | null;
  id: string;
  source_exercise_key: string | null;
};

export function logProgress(level: "error" | "info" | "warn", message: string, context?: Record<string, unknown>) {
  console[level]("[progress]", message, context ?? {});
}

export function calculateDurationMinutes(startedAt: string, completedAt: string | null) {
  if (!completedAt) return null;

  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed <= started) return null;

  return Math.round((completed - started) / (1000 * 60));
}

export function formatFallbackTitle(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value;
}

export function formatSignalWorkoutSubtitle(row: SignalWorkoutSubtitleRow) {
  const week = row.source_week_key ? `Week ${row.source_week_key}` : "Week unavailable";
  const day = row.source_day_key ? `Day ${row.source_day_key}` : "Day unavailable";
  return `${week} · ${day}`;
}

export function getWorkoutLogIdentityKey(log: WorkoutLogIdentityRow) {
  return log.source_exercise_key?.trim() || log.exercise_library_id?.trim() || log.exercise_name?.trim() || log.id;
}
