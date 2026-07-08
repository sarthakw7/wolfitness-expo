import type { HealthMetricSummaryFields } from "../types";

export function getLocalDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
  return parsed;
}

export function parseOptionalPositiveInteger(value: string) {
  const parsed = parseOptionalInteger(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

export function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function parseOptionalPositiveNumber(value: string) {
  const parsed = parseOptionalNumber(value);
  if (parsed === null || parsed <= 0) return null;
  return parsed;
}

export function validateOptionalPositiveInteger(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return `${label} must be a positive integer.`;
  }
  return null;
}

export function validateOptionalPositiveNumber(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return `${label} must be greater than 0.`;
  }
  return null;
}

export function validateOptionalSleepHours(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) {
    return "Sleep hours must be between 0 and 24.";
  }
  return null;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

export function formatHealthMetricsSummary(metrics: HealthMetricSummaryFields | null | undefined) {
  if (!metrics) return null;

  const parts: string[] = [];
  if (typeof metrics.steps === "number") parts.push(`${formatInteger(metrics.steps)} steps`);
  if (typeof metrics.sleepHours === "number") parts.push(`${formatDecimal(metrics.sleepHours)}h sleep`);
  if (typeof metrics.restingHeartRate === "number") parts.push(`${metrics.restingHeartRate} bpm`);
  if (typeof metrics.caloriesBurned === "number") parts.push(`${formatInteger(metrics.caloriesBurned)} cal`);
  if (typeof metrics.bodyWeightKg === "number") parts.push(`${formatDecimal(metrics.bodyWeightKg)} kg`);

  if (parts.length === 0) return null;
  return `Today: ${parts.slice(0, 3).join(" · ")}`;
}

export function formatMetricPreview(metrics: HealthMetricSummaryFields | null | undefined) {
  const summary = formatHealthMetricsSummary(metrics);
  if (summary) return summary;
  return "Add today's health metrics manually.";
}
