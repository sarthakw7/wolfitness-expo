import type { WorkoutProgramPayload } from "@/src/services/programs";
import { findDay, findWeek, isSignalPlayableDay } from "./signalSelection";

export type SignalWorkoutNextDayResult = {
  error?: string;
  isProgramCompleted: boolean;
  nextDayKey: string | null;
  nextWeekKey: string | null;
};

export function findNextSignalWorkoutDay(
  payload: WorkoutProgramPayload | null | undefined,
  currentWeekKey: string | null | undefined,
  currentDayKey: string | null | undefined,
): SignalWorkoutNextDayResult {
  if (!payload?.program?.id || !Array.isArray(payload.weeks)) {
    return {
      error: "missing_program",
      isProgramCompleted: false,
      nextDayKey: null,
      nextWeekKey: null,
    };
  }

  if (!currentWeekKey) {
    return {
      error: "missing_week",
      isProgramCompleted: false,
      nextDayKey: null,
      nextWeekKey: null,
    };
  }

  const currentWeekIndex = payload.weeks.findIndex((week) => week.id === currentWeekKey || week.sync_key === currentWeekKey);
  if (currentWeekIndex < 0) {
    return {
      error: "week_not_found",
      isProgramCompleted: false,
      nextDayKey: null,
      nextWeekKey: null,
    };
  }

  if (!currentDayKey) {
    return {
      error: "missing_day",
      isProgramCompleted: false,
      nextDayKey: null,
      nextWeekKey: null,
    };
  }

  const currentWeek = payload.weeks[currentWeekIndex];
  const currentDayIndex = currentWeek.days.findIndex((day) => day.id === currentDayKey || day.sync_key === currentDayKey);
  if (currentDayIndex < 0) {
    return {
      error: "day_not_found",
      isProgramCompleted: false,
      nextDayKey: null,
      nextWeekKey: null,
    };
  }

  const laterDaysInCurrentWeek = currentWeek.days.slice(currentDayIndex + 1);
  const nextPlayableInCurrentWeek = laterDaysInCurrentWeek.find((day) => isSignalPlayableDay(day));
  if (nextPlayableInCurrentWeek) {
    return {
      isProgramCompleted: false,
      nextDayKey: nextPlayableInCurrentWeek.sync_key,
      nextWeekKey: currentWeek.sync_key,
    };
  }

  for (let index = currentWeekIndex + 1; index < payload.weeks.length; index += 1) {
    const nextWeek = payload.weeks[index];
    const nextPlayableDay = nextWeek.days.find((day) => isSignalPlayableDay(day));
    if (nextPlayableDay) {
      return {
        isProgramCompleted: false,
        nextDayKey: nextPlayableDay.sync_key,
        nextWeekKey: nextWeek.sync_key,
      };
    }
  }

  return {
    isProgramCompleted: true,
    nextDayKey: null,
    nextWeekKey: null,
  };
}

export function resolveNextSignalWorkoutPreview(
  payload: WorkoutProgramPayload,
  currentWeekKey: string | null | undefined,
  currentDayKey: string | null | undefined,
) {
  const nextDay = findNextSignalWorkoutDay(payload, currentWeekKey, currentDayKey);
  if (nextDay.error || !nextDay.nextDayKey || !nextDay.nextWeekKey) return null;
  const nextWeek = findWeek(payload.weeks, nextDay.nextWeekKey);
  const nextDayRow = findDay(nextWeek, nextDay.nextDayKey);
  if (!nextWeek || !nextDayRow) return null;
  return {
    dayLabel: nextDayRow.title,
    weekLabel: nextWeek.title,
  };
}
