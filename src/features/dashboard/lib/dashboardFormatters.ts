import { normalizeGoalType } from "@/src/features/user-goals/constants";

export function dayKey(dateIso: string) {
  return dateIso.slice(0, 10);
}

export function percent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, value / total));
}

export function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

export function prettyGoal(raw: string | null | undefined) {
  const goal = normalizeGoalType(raw);
  if (!goal) return "Precision Training.";

  switch (goal) {
    case "fat_loss":
      return "Fat Loss Focus.";
    case "muscle_gain":
      return "Muscle Gain Focus.";
    case "strength":
      return "Strength Focus.";
    case "endurance":
      return "Endurance Build.";
    case "hybrid_athlete":
      return "Hybrid Athlete Focus.";
    case "general_health":
      return "General Health.";
    default:
      return `${titleCase(goal)}.`;
  }
}

export function estimateSessionMinutes(exerciseCount: number) {
  if (exerciseCount <= 0) return 45;
  return Math.max(35, Math.min(85, exerciseCount * 9));
}

export function formatStartedAgo(value: string | null | undefined) {
  if (!value) return null;
  const startedAt = new Date(value).getTime();
  if (!Number.isFinite(startedAt)) return null;

  const elapsedMinutes = Math.max(1, Math.floor((Date.now() - startedAt) / (1000 * 60)));
  if (elapsedMinutes < 60) return `Started ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  if (minutes === 0) return `Started ${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `Started ${hours}h ${minutes}m ago`;
}

export function formatActiveSignalWorkoutTitle(
  programTitle: string | null | undefined,
  weeks: {
    days: { position: number; sync_key: string; title: string }[];
    position: number;
    sync_key: string;
    title: string;
  }[] | null | undefined,
  sourceWeekKey: string | null | undefined,
  sourceDayKey: string | null | undefined,
) {
  const resolvedProgramTitle = programTitle?.trim() || "Signal Workout";
  const week = weeks?.find((candidate) => candidate.sync_key === sourceWeekKey || candidate.title === sourceWeekKey) ?? null;
  const day = week?.days.find((candidate) => candidate.sync_key === sourceDayKey || candidate.title === sourceDayKey) ?? null;

  if (week && day) {
    const weekNumber = Number.isFinite(week.position) ? week.position + 1 : null;
    const dayNumber = Number.isFinite(day.position) ? day.position + 1 : null;

    if (weekNumber && dayNumber) {
      return `${resolvedProgramTitle} · Week ${weekNumber} · Day ${dayNumber}`;
    }
  }

  return `${resolvedProgramTitle} · Active Session`;
}
