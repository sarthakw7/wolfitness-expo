import type {
  WorkoutProgramPayload,
  WorkoutProgramPayloadDay,
  WorkoutProgramPayloadWeek,
} from "@/src/services/programs";

export type SignalWorkoutSelection = {
  dayId?: string | null;
  weekId?: string | null;
};

export type SignalWorkoutSelectionState =
  | {
      day: WorkoutProgramPayloadDay | null;
      status: "day_not_found" | "missing_day" | "missing_week" | "week_not_found" | "missing_program" | "empty_payload" | "ok";
      week: WorkoutProgramPayloadWeek | null;
    }
  | {
      day: null;
      status: "empty_payload" | "missing_program";
      week: null;
    };

export function matchesSignalKey(row: { id: string; sync_key: string }, key: string | null | undefined) {
  return Boolean(key && (row.id === key || row.sync_key === key));
}

export function findWeek(weeks: WorkoutProgramPayloadWeek[], weekId?: string | null) {
  if (!weeks.length) return null;
  if (!weekId) return null;
  return weeks.find((week) => matchesSignalKey(week, weekId)) ?? null;
}

export function findDay(week: WorkoutProgramPayloadWeek | null, dayId?: string | null) {
  if (!week?.days.length) return null;
  if (!dayId) return null;
  return week.days.find((day) => matchesSignalKey(day, dayId)) ?? null;
}

export function isSignalPlayableDay(day: WorkoutProgramPayloadDay | null | undefined) {
  if (!day) return false;
  return day.blocks.some((block) => block.exercises.length > 0);
}

export function findFirstPlayableSignalSelection(weeks: WorkoutProgramPayloadWeek[]) {
  for (const week of weeks) {
    for (const day of week.days) {
      if (isSignalPlayableDay(day)) {
        return {
          dayKey: day.sync_key,
          weekKey: week.sync_key,
        };
      }
    }
  }

  return null;
}

export function resolveSignalWorkoutSelection(
  payload: WorkoutProgramPayload | null | undefined,
  selection: SignalWorkoutSelection,
): SignalWorkoutSelectionState {
  if (!payload?.program?.id || !Array.isArray(payload.weeks)) {
    return {
      day: null,
      status: "missing_program",
      week: null,
    };
  }

  if (payload.weeks.length === 0) {
    return {
      day: null,
      status: "empty_payload",
      week: null,
    };
  }

  if (!selection.weekId) {
    return {
      day: null,
      status: "missing_week",
      week: null,
    };
  }

  const week = findWeek(payload.weeks, selection.weekId);
  if (!week) {
    return {
      day: null,
      status: "week_not_found",
      week: null,
    };
  }

  if (!selection.dayId) {
    return {
      day: null,
      status: "missing_day",
      week,
    };
  }

  const day = findDay(week, selection.dayId);
  if (!day) {
    return {
      day: null,
      status: "day_not_found",
      week,
    };
  }

  return {
    day,
    status: "ok",
    week,
  };
}
