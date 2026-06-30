import type {
  ExerciseLibraryRow,
  ProgramExerciseRow,
  WorkoutExercise,
  WorkoutPlanForToday,
} from "./workout.service";
import type { Enrollment } from "./enrollment.service";
import type { Program } from "./programs.service";
import type {
  WorkoutProgramPayload,
  WorkoutProgramPayloadBlock,
  WorkoutProgramPayloadDay,
  WorkoutProgramPayloadExercise,
  WorkoutProgramPayloadWeek,
} from "./programs";

export type SignalWorkoutSelection = {
  dayId?: string | null;
  weekId?: string | null;
};

export type SignalWorkoutExecutionContext = WorkoutPlanForToday;

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

export type SignalWorkoutNextDayResult = {
  error?: string;
  isProgramCompleted: boolean;
  nextDayKey: string | null;
  nextWeekKey: string | null;
};

export type SignalProgramLifecycleRow = {
  completed_at: string | null;
  current_day_key: string | null;
  current_week_key: string | null;
  id: string;
  source: "legacy" | "signal";
  source_program_id: string;
  source_program_version: string | null;
  started_at: string;
  status: "active" | "paused" | "completed" | "replaced";
  updated_at: string;
  user_id: string;
};

export type SignalCompletedWorkoutSessionRow = {
  completed_at: string | null;
  id: string;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_week_key: string | null;
};

export type SignalProgramProgressState =
  | {
      kind: "hidden";
    }
  | {
      body: string;
      ctaLabel?: string;
      kind: "active_pointer_invalid" | "program_unavailable";
      title: string;
    }
  | {
      ctaLabel?: string;
      completedWorkouts: number;
      currentDayLabel: string;
      currentWeekLabel: string;
      isProgramCompleted: boolean;
      kind: "ready";
      nextWorkoutPreview: {
        dayLabel: string;
        weekLabel: string;
      } | null;
      percentage: number;
      programTitle: string;
      totalWorkouts: number;
    };

export type SignalProgramOverviewPreviewDay = {
  dayKey: string;
  exerciseCount: number;
  isPlayable: boolean;
  title: string;
};

export type SignalProgramOverviewPreviewWeek = {
  days: SignalProgramOverviewPreviewDay[];
  totalExerciseCount: number;
  totalPlayableWorkouts: number;
  title: string;
  weekKey: string;
};

export type SignalProgramOverview = {
  averageWorkoutsPerWeek: number;
  difficulty: string | null;
  duration: string | null;
  goal: string | null;
  previewWeeks: SignalProgramOverviewPreviewWeek[];
  topExerciseNames: string[];
  totalExercises: number;
  totalPlayableWorkouts: number;
  totalWeeks: number;
};

function findWeek(weeks: WorkoutProgramPayloadWeek[], weekId?: string | null) {
  if (!weeks.length) return null;
  if (!weekId) return null;
  return weeks.find((week) => week.id === weekId || week.sync_key === weekId) ?? null;
}

function findDay(week: WorkoutProgramPayloadWeek | null, dayId?: string | null) {
  if (!week?.days.length) return null;
  if (!dayId) return null;
  return week.days.find((day) => day.id === dayId || day.sync_key === dayId) ?? null;
}

function isPlayableDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.some((block) => block.exercises.length > 0);
}

function countExercisesInDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.reduce((blockTotal, block) => blockTotal + block.exercises.length, 0);
}

function countPlayableWorkouts(payload: WorkoutProgramPayload) {
  return payload.weeks.reduce((weekTotal, week) => {
    return weekTotal + week.days.filter((day) => isPlayableDay(day)).length;
  }, 0);
}

function sanitizeProgramMeta(value: string | null | undefined, fallbackValues: string[]) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return fallbackValues.includes(normalized) ? null : normalized;
}

function findWeekByKey(weeks: WorkoutProgramPayloadWeek[], weekKey: string | null | undefined) {
  if (!weekKey) return null;
  return weeks.find((week) => week.id === weekKey || week.sync_key === weekKey) ?? null;
}

function findDayByKey(week: WorkoutProgramPayloadWeek | null, dayKey: string | null | undefined) {
  if (!week || !dayKey) return null;
  return week.days.find((day) => day.id === dayKey || day.sync_key === dayKey) ?? null;
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
  const nextPlayableInCurrentWeek = laterDaysInCurrentWeek.find((day) => isPlayableDay(day));
  if (nextPlayableInCurrentWeek) {
    return {
      isProgramCompleted: false,
      nextDayKey: nextPlayableInCurrentWeek.sync_key,
      nextWeekKey: currentWeek.sync_key,
    };
  }

  for (let index = currentWeekIndex + 1; index < payload.weeks.length; index += 1) {
    const nextWeek = payload.weeks[index];
    const nextPlayableDay = nextWeek.days.find((day) => isPlayableDay(day));
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

export function getSignalProgramProgress(
  payload: WorkoutProgramPayload | null | undefined,
  completedSessions: SignalCompletedWorkoutSessionRow[] | null | undefined,
  lifecycle: SignalProgramLifecycleRow | null | undefined,
): SignalProgramProgressState {
  if (!lifecycle) {
    return { kind: "hidden" };
  }

  if (!payload?.program?.title || !Array.isArray(payload.weeks)) {
    return {
      body: "We could not load the published Signal workout behind this program.",
      ctaLabel: "Browse Programs",
      kind: "program_unavailable",
      title: "Program unavailable",
    };
  }

  const totalWorkouts = countPlayableWorkouts(payload);
  if (totalWorkouts <= 0) {
    return {
      body: "This Signal program does not contain any playable workouts yet.",
      ctaLabel: "Browse Programs",
      kind: "program_unavailable",
      title: "Program unavailable",
    };
  }

  const selection = resolveSignalWorkoutSelection(payload, {
    dayId: lifecycle.current_day_key,
    weekId: lifecycle.current_week_key,
  });

  if (selection.status !== "ok" || !selection.day || !selection.week) {
    return {
      body: "Your active Signal program points to a week or day that is no longer available.",
      ctaLabel: "Browse Programs",
      kind: "active_pointer_invalid",
      title: "Active program unavailable",
    };
  }

  const validCompletedSessions = (completedSessions ?? []).filter(
    (session) =>
      session.source === "signal" &&
      session.completed_at !== null &&
      session.source_program_id === lifecycle.source_program_id,
  );
  const completedWorkouts =
    lifecycle.status === "completed"
      ? totalWorkouts
      : Math.min(validCompletedSessions.length, totalWorkouts);
  const isProgramCompleted = lifecycle.status === "completed" || completedWorkouts >= totalWorkouts;
  const percentage = Math.round((completedWorkouts / totalWorkouts) * 100);

  const nextWorkoutPreview = isProgramCompleted
    ? null
    : (() => {
        const nextDay = findNextSignalWorkoutDay(payload, lifecycle.current_week_key, lifecycle.current_day_key);
        if (nextDay.error || !nextDay.nextDayKey || !nextDay.nextWeekKey) return null;
        const nextWeek = findWeekByKey(payload.weeks, nextDay.nextWeekKey);
        const nextDayRow = findDayByKey(nextWeek, nextDay.nextDayKey);
        if (!nextWeek || !nextDayRow) return null;
        return {
          dayLabel: nextDayRow.title,
          weekLabel: nextWeek.title,
        };
      })();

  return {
    completedWorkouts,
    currentDayLabel: selection.day.title,
    currentWeekLabel: selection.week.title,
    isProgramCompleted,
    kind: "ready",
    nextWorkoutPreview,
    percentage,
    programTitle: payload.program.title,
    totalWorkouts,
  };
}

export function getSignalProgramOverview(
  payload: WorkoutProgramPayload | null | undefined,
  previewWeekLimit = 3,
): SignalProgramOverview {
  if (!payload?.program?.id || !Array.isArray(payload.weeks)) {
    return {
      averageWorkoutsPerWeek: 0,
      difficulty: null,
      duration: null,
      goal: null,
      previewWeeks: [],
      topExerciseNames: [],
      totalExercises: 0,
      totalPlayableWorkouts: 0,
      totalWeeks: 0,
    };
  }

  const totalWeeks = payload.weeks.length;
  const totalPlayableWorkouts = countPlayableWorkouts(payload);
  const totalExercises = payload.weeks.reduce((weekTotal, week) => {
    return weekTotal + week.days.reduce((dayTotal, day) => dayTotal + countExercisesInDay(day), 0);
  }, 0);

  const averageWorkoutsPerWeek =
    totalWeeks > 0 ? Math.round((totalPlayableWorkouts / totalWeeks) * 10) / 10 : 0;

  const previewWeeks = payload.weeks.slice(0, Math.max(0, previewWeekLimit)).map((week) => ({
    days: week.days.map((day) => ({
      dayKey: day.sync_key,
      exerciseCount: countExercisesInDay(day),
      isPlayable: isPlayableDay(day),
      title: day.title,
    })),
    title: week.title,
    totalExerciseCount: week.days.reduce((dayTotal, day) => dayTotal + countExercisesInDay(day), 0),
    totalPlayableWorkouts: week.days.filter((day) => isPlayableDay(day)).length,
    weekKey: week.sync_key,
  }));

  const topExerciseNames = Array.from(
    new Set(
      payload.weeks.flatMap((week) =>
        week.days.flatMap((day) =>
          day.blocks.flatMap((block) =>
            block.exercises
              .map((exercise) => exercise.exerciseName.trim())
              .filter((exerciseName) => exerciseName.length > 0),
          ),
        ),
      ),
    ),
  ).slice(0, 8);

  return {
    averageWorkoutsPerWeek,
    difficulty: sanitizeProgramMeta(payload.program.difficulty, ["Unknown"]),
    duration: sanitizeProgramMeta(payload.program.duration, ["Ongoing"]),
    goal: sanitizeProgramMeta(payload.program.goal, ["Performance"]),
    previewWeeks,
    topExerciseNames,
    totalExercises,
    totalPlayableWorkouts,
    totalWeeks,
  };
}

function parseInteger(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toProgram(day: WorkoutProgramPayloadDay, week: WorkoutProgramPayloadWeek, programId: string): Program {
  return {
    coach_avatar_url: null,
    coach_name: null,
    created_at: new Date().toISOString(),
    creator_id: "signal",
    description: null,
    difficulty: null,
    duration_weeks: null,
    id: programId,
    image_url: null,
    is_published: true,
    is_subscription: false,
    price: 0,
    title: week.title || day.title || "Signal Workout",
    vibe_type: null,
  };
}

function toEnrollment(programId: string, userId: string): Enrollment {
  return {
    enrolled_at: new Date().toISOString(),
    expires_at: null,
    id: `signal-enrollment:${programId}:${userId}`,
    program_id: programId,
    status: "active",
    stripe_subscription_id: null,
    user_id: userId,
  };
}

function toLibraryRow(exercise: WorkoutProgramPayloadExercise): ExerciseLibraryRow {
  return {
    id: exercise.exerciseId,
    name: exercise.exerciseName,
    primary_muscle: null,
    video_url: exercise.media[0] ?? null,
  };
}

function toPrescription(day: WorkoutProgramPayloadDay, block: WorkoutProgramPayloadBlock, exercise: WorkoutProgramPayloadExercise): ProgramExerciseRow {
  return {
    day_id: day.id,
    exercise_library_id: exercise.exerciseId,
    id: exercise.id,
    notes: exercise.notes || block.description || null,
    order_index: exercise.position,
    rest_seconds: parseInteger(exercise.rest),
    target_reps: exercise.reps || null,
    target_rpe: parseInteger(exercise.rpe),
    target_sets: parseInteger(exercise.sets),
  };
}

function toWorkoutExercise(day: WorkoutProgramPayloadDay, block: WorkoutProgramPayloadBlock, exercise: WorkoutProgramPayloadExercise): WorkoutExercise {
  return {
    exercise: toLibraryRow(exercise),
    prescription: toPrescription(day, block, exercise),
  };
}

export function buildSignalWorkoutExecutionContext(
  payload: WorkoutProgramPayload,
  selection: SignalWorkoutSelection,
  userId: string,
): SignalWorkoutExecutionContext | null {
  const resolved = resolveSignalWorkoutSelection(payload, selection);
  const week = resolved.week;
  const day = resolved.day;
  if (resolved.status !== "ok" || !week || !day) return null;

  const exercises = day.blocks.flatMap((block) => block.exercises.map((exercise) => toWorkoutExercise(day, block, exercise)));
  const program = {
    ...toProgram(day, week, payload.program.id),
    title: payload.program.title,
    description: payload.program.subtitle ?? null,
  };

  return {
    day: {
      day_number: day.position + 1,
      id: day.id,
      title: day.title,
      week_id: week.id,
    },
    enrollment: toEnrollment(payload.program.id, userId),
    exercises,
    program,
    week: {
      id: week.id,
      program_id: payload.program.id,
      title: week.title,
      week_number: week.position + 1,
    },
  };
}

export function hasSignalWorkoutPayload(payload: WorkoutProgramPayload | null | undefined): payload is WorkoutProgramPayload {
  return Boolean(payload?.program?.id && Array.isArray(payload.weeks));
}
