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
import {
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  normalizeWorkoutExerciseMediaList,
  parseYouTubeVideoId,
  type WorkoutExerciseMedia,
} from "@/src/lib/youtube-media";
import { toCalendarIsoDate } from "@/src/lib/date";

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
  active_program_id: string | null;
  id: string;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_program_version: string | null;
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

export type SignalWorkoutBlockPreview = {
  exerciseCount: number;
  exerciseNames: string[];
  instruction: string | null;
  isInstructionOnly: boolean;
  isMixed: boolean;
  isPlayable: boolean;
  key: string;
  prescriptionSummary: string | null;
  title: string;
};

export type SignalWorkoutDayPreview = {
  blockCount: number;
  blocks: SignalWorkoutBlockPreview[];
  coachInstructions: string | null;
  exerciseCount: number;
  isPlayable: boolean;
};

export type SignalWorkoutStepType =
  | "coach_instructions"
  | "instruction_block"
  | "exercise_block"
  | "done_training"
  | "reflection"
  | "summary";

export type SignalWorkoutStep = {
  block?: WorkoutProgramPayloadBlock;
  blockIndex?: number;
  blockLabel?: string;
  body?: string;
  exercises?: WorkoutProgramPayloadExercise[];
  id: string;
  label: string;
  subtitle?: string;
  title: string;
  type: SignalWorkoutStepType;
};

export type SignalCalendarDayCell = {
  date: Date;
  dayKey: string | null;
  dayLabel: string;
  isCompleted: boolean;
  isAssigned: boolean;
  isPlayable: boolean;
  isSelected: boolean;
  isToday: boolean;
  monthYearLabel: string;
  weekdayLabel: string;
  title: string;
  weekKey: string | null;
  weekLabel: string | null;
};

export type SignalWeekCalendarStrip = {
  days: SignalCalendarDayCell[];
  monthYearLabel: string;
};

function parseSignalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addSignalDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfSundayWeek(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(date.getDate() - date.getDay());
  return weekStart;
}

function toCalendarDateLabel(date: Date) {
  return String(date.getDate()).padStart(2, "0");
}

function toCalendarWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date).toUpperCase();
}

export function getSignalBlockLabel(blockIndex: number) {
  if (blockIndex >= 0 && blockIndex < 26) {
    return String.fromCharCode(65 + blockIndex);
  }

  return `${blockIndex + 1}`;
}

export function getSignalExerciseLabel(blockLabel: string, exerciseIndex: number) {
  return `${blockLabel}${exerciseIndex + 1}`;
}

export function formatMonthYearLabel(date: Date) {
  const month = new Intl.DateTimeFormat(undefined, { month: "long" }).format(date).toUpperCase();
  const year = String(date.getFullYear()).slice(-2);
  return `${month} ’${year}`;
}

export function resolveSignalDayDate(
  programStartedAt: string | null | undefined,
  week: WorkoutProgramPayloadWeek,
  day: WorkoutProgramPayloadDay,
): Date {
  const anchor = parseSignalDate(programStartedAt) ?? new Date();
  const weekOffset = (typeof week.position === "number" ? week.position : 0) * 7;
  const dayOffset = typeof day.position === "number" ? day.position : 0;
  return addSignalDays(anchor, weekOffset + dayOffset);
}

export function buildSignalWeekCalendarDays(
  payload: WorkoutProgramPayload | null | undefined,
  programStartedAt: string | null | undefined,
  selectedWeekKey: string | null | undefined,
  selectedDateIso: string | null | undefined,
  completedDayKeys: Set<string> | string[] = [],
): SignalWeekCalendarStrip | null {
  if (!payload?.program?.id || !Array.isArray(payload.weeks) || payload.weeks.length === 0) {
    return null;
  }

  const selectedWeek = payload.weeks.find((week) => week.id === selectedWeekKey || week.sync_key === selectedWeekKey) ?? null;
  if (!selectedWeek) {
    return null;
  }

  const completedSet = new Set(Array.isArray(completedDayKeys) ? completedDayKeys : Array.from(completedDayKeys));
  const weekAnchor = parseSignalDate(programStartedAt) ?? new Date();
  const programWeekStart = addSignalDays(weekAnchor, (typeof selectedWeek.position === "number" ? selectedWeek.position : 0) * 7);
  const visibleWeekStart = selectedDateIso
    ? startOfSundayWeek(parseSignalDate(selectedDateIso) ?? programWeekStart)
    : startOfSundayWeek(programWeekStart);
  const selectedIso = selectedDateIso ? selectedDateIso.slice(0, 10) : null;
  const dayByDateIso = new Map<string, WorkoutProgramPayloadDay>();
  selectedWeek.days.forEach((day) => {
    const dayDateIso = toCalendarIsoDate(resolveSignalDayDate(programStartedAt, selectedWeek, day));
    dayByDateIso.set(dayDateIso, day);
  });
  const monthYearLabel = formatMonthYearLabel(visibleWeekStart);
  const todayIso = toCalendarIsoDate(new Date());

  return {
    monthYearLabel,
    days: Array.from({ length: 7 }).map((_, dayOffset) => {
      const date = addSignalDays(visibleWeekStart, dayOffset);
      const dateIso = toCalendarIsoDate(date);
      const assignedDay = dayByDateIso.get(dateIso) ?? null;
      return {
        date,
        dayKey: assignedDay?.sync_key ?? null,
        dayLabel: toCalendarDateLabel(date),
        isAssigned: Boolean(assignedDay),
        isCompleted: assignedDay ? completedSet.has(assignedDay.sync_key) : false,
        isPlayable: isSignalPlayableDay(assignedDay),
        isSelected: selectedIso ? dateIso === selectedIso : false,
        isToday: dateIso === todayIso,
        monthYearLabel: formatMonthYearLabel(visibleWeekStart),
        weekdayLabel: toCalendarWeekdayLabel(date),
        title: assignedDay?.title ?? "Rest",
        weekKey: selectedWeek.sync_key,
        weekLabel: selectedWeek.title,
      };
    }),
  };
}

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

export function isSignalPlayableDay(day: WorkoutProgramPayloadDay | null | undefined) {
  if (!day) return false;
  return day.blocks.some((block) => block.exercises.length > 0);
}

function countExercisesInDay(day: WorkoutProgramPayloadDay) {
  return day.blocks.reduce((blockTotal, block) => blockTotal + block.exercises.length, 0);
}

function countPlayableWorkouts(payload: WorkoutProgramPayload) {
  return payload.weeks.reduce((weekTotal, week) => {
    return weekTotal + week.days.filter((day) => isSignalPlayableDay(day)).length;
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
      session.active_program_id === lifecycle.id &&
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
      isPlayable: isSignalPlayableDay(day),
      title: day.title,
    })),
    title: week.title,
    totalExerciseCount: week.days.reduce((dayTotal, day) => dayTotal + countExercisesInDay(day), 0),
    totalPlayableWorkouts: week.days.filter((day) => isSignalPlayableDay(day)).length,
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

function compactPrescription(exercise: WorkoutProgramPayloadExercise) {
  return [
    exercise.sets ? `${exercise.sets} sets` : null,
    exercise.reps ? `${exercise.reps} reps` : null,
    exercise.rpe ? `RPE ${exercise.rpe}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatSignalExercisePrescription(exercise: WorkoutProgramPayloadExercise) {
  return compactPrescription(exercise) || null;
}

function getCoachInstructionsBody(day: WorkoutProgramPayloadDay) {
  return day.coachInstructions?.trim() || null;
}

export function buildSignalWorkoutSteps(day: WorkoutProgramPayloadDay | null | undefined): SignalWorkoutStep[] {
  if (!day) return [];

  const steps: SignalWorkoutStep[] = [];
  const coachInstructions = getCoachInstructionsBody(day);

  if (coachInstructions) {
    steps.push({
      body: coachInstructions,
      id: `coach:${day.sync_key}`,
      label: "COACH",
      title: "Coach Instructions",
      type: "coach_instructions",
    });
  }

  day.blocks.forEach((block, blockIndex) => {
    const blockLabel = getSignalBlockLabel(blockIndex);
    const blockBody = block.description?.trim() || null;
    const blockTitle = block.title?.trim() || `${blockLabel}. Block`;

    if (block.exercises.length === 0) {
      steps.push({
        block,
        blockIndex,
        blockLabel,
        body: blockBody ?? "Review this block before continuing.",
        id: `block:${block.sync_key}`,
        label: blockLabel,
        subtitle: blockBody ?? undefined,
        title: blockTitle,
        type: "instruction_block",
      });
      return;
    }

    steps.push({
      block,
      blockIndex,
      blockLabel,
      body: blockBody ?? undefined,
      exercises: block.exercises,
      id: `exercise-block:${block.sync_key}`,
      label: blockLabel,
      subtitle: "Exercise Block",
      title: blockTitle,
      type: "exercise_block",
    });
  });

  steps.push(
    {
      body: "You have completed the workout portion of this session.",
      id: `done-training:${day.sync_key}`,
      label: "DONE",
      title: "Done Training",
      type: "done_training",
    },
    {
      body: "Rate the session, note how it felt, then finish.",
      id: `reflection:${day.sync_key}`,
      label: "REFLECTION",
      title: "Session Reflection",
      type: "reflection",
    },
    {
      body: "Your session summary will appear after finish.",
      id: `summary:${day.sync_key}`,
      label: "SUMMARY",
      title: "Final Summary",
      type: "summary",
    },
  );

  return steps;
}

export function resolveSignalWorkoutInitialStepIndex(
  steps: SignalWorkoutStep[] | null | undefined,
  focus: { blockIndex?: number | null; exerciseIndex?: number | null; stepType?: string | null },
) {
  if (!steps?.length) return 0;

  const blockIndex = focus.blockIndex ?? null;
  const exerciseIndex = focus.exerciseIndex ?? null;
  const stepType = focus.stepType ?? null;

  if (stepType === "coach") {
    const coachStepIndex = steps.findIndex((step) => step.type === "coach_instructions");
    if (coachStepIndex >= 0) return coachStepIndex;
  }

  if (stepType === "summary") {
    const summaryStepIndex = steps.findIndex((step) => step.type === "summary");
    if (summaryStepIndex >= 0) return summaryStepIndex;
  }

  if (blockIndex != null && exerciseIndex != null) {
    const focusedExerciseIndex = steps.findIndex(
      (step) => step.type === "exercise_block" && step.blockIndex === blockIndex,
    );
    if (focusedExerciseIndex >= 0) return focusedExerciseIndex;
  }

  if (blockIndex != null) {
    const blockStepIndex = steps.findIndex((step) => step.blockIndex === blockIndex);
    if (blockStepIndex >= 0) return blockStepIndex;
  }

  const coachStepIndex = steps.findIndex((step) => step.type === "coach_instructions");
  if (coachStepIndex >= 0) return coachStepIndex;

  const firstWorkoutStepIndex = steps.findIndex(
    (step) => step.type === "instruction_block" || step.type === "exercise_block",
  );
  return firstWorkoutStepIndex >= 0 ? firstWorkoutStepIndex : 0;
}

export function getSignalWorkoutDayPreview(
  day: WorkoutProgramPayloadDay | null | undefined,
): SignalWorkoutDayPreview {
  if (!day) {
    return {
      blockCount: 0,
      blocks: [],
      coachInstructions: null,
      exerciseCount: 0,
      isPlayable: false,
    };
  }

  const blocks = day.blocks.map((block) => {
    const instruction = block.description?.trim() || null;
    const exerciseNames = block.exercises
      .map((exercise) => exercise.exerciseName.trim())
      .filter((name) => name.length > 0)
      .slice(0, 4);
    const prescriptionSummary =
      block.exercises.map(compactPrescription).find((summary) => summary.length > 0) ?? null;

    return {
      exerciseCount: block.exercises.length,
      exerciseNames,
      instruction,
      isInstructionOnly: block.exercises.length === 0 && Boolean(instruction),
      isMixed: block.exercises.length > 0 && Boolean(instruction),
      isPlayable: block.exercises.length > 0,
      key: block.sync_key,
      prescriptionSummary,
      title: block.title || "Workout Block",
    };
  });
  const mappedCoachInstructions = day.coachInstructions?.trim() ?? null;
  if (__DEV__) {
    console.log("[SignalAdapter] mapped coach instructions", mappedCoachInstructions);
  }

  return {
    blockCount: day.blocks.length,
    blocks,
    coachInstructions: mappedCoachInstructions,
    exerciseCount: countExercisesInDay(day),
    isPlayable: isSignalPlayableDay(day),
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
  const normalizedMediaItems = normalizeWorkoutExerciseMediaList(exercise.mediaItems);
  const firstMedia = normalizedMediaItems[0] ?? null;
  const legacyVideoUrl = exercise.media.find((value) => parseYouTubeVideoId(value)) ?? exercise.media[0] ?? null;
  const videoId = firstMedia?.videoId ?? parseYouTubeVideoId(legacyVideoUrl);
  const mediaItems: WorkoutExerciseMedia[] = normalizedMediaItems.length
    ? normalizedMediaItems
    : videoId
      ? [{
          id: exercise.id,
          provider: "youtube",
          thumbnailUrl: buildYouTubeThumbnailUrl(videoId),
          title: exercise.exerciseName,
          type: "youtube",
          url: buildYouTubeWatchUrl(videoId),
          videoId,
        }]
      : [];

  return {
    id: exercise.exerciseId,
    media_items: mediaItems,
    name: exercise.exerciseName,
    primary_muscle: null,
    thumbnail_url: firstMedia?.thumbnailUrl ?? (videoId ? buildYouTubeThumbnailUrl(videoId) : null),
    video_id: videoId ?? null,
    video_provider: mediaItems[0]?.provider ?? null,
    video_title: firstMedia?.title ?? exercise.exerciseName,
    video_url: firstMedia?.url ?? (videoId ? buildYouTubeWatchUrl(videoId) : legacyVideoUrl),
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
    source_exercise_key: exercise.sync_key,
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
    source_day_key: day.sync_key,
    source_week_key: week.sync_key,
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
