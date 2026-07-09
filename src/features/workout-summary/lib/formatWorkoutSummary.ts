import type { WorkoutSummary } from "../types";

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function formatOptionalDurationMinutes(minutes: number | null | undefined) {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) return null;

  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;

  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatDurationMinutes(minutes: number | null | undefined) {
  return formatOptionalDurationMinutes(minutes) ?? "Not tracked";
}

export function formatVolumeKg(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "--";
  return `${formatNumber(value, 1)} kg`;
}

export function formatReps(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "--";
  return `${formatNumber(Math.round(value))} reps`;
}

export function formatAverageRpe(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return `${formatNumber(value, 1)} avg RPE`;
}

export function formatSummaryLine(summary: Pick<WorkoutSummary, "durationMinutes" | "totalExercises" | "totalReps" | "totalSets" | "totalVolumeKg">) {
  const duration = formatOptionalDurationMinutes(summary.durationMinutes);
  return [
    duration,
    `${formatNumber(summary.totalExercises)} exercises`,
    `${formatNumber(summary.totalSets)} sets`,
    formatReps(summary.totalReps),
    formatVolumeKg(summary.totalVolumeKg),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
}
