import { supabase } from "@/src/lib/supabase";
import type { WorkoutExerciseMedia } from "@/src/lib/youtube-media";

import type { Enrollment } from "./enrollment.service";
import type { Program } from "./programs.service";

export type ProgramWeek = {
  id: string;
  program_id: string;
  title: string | null;
  week_number: number;
};

export type ProgramDay = {
  day_number: number;
  id: string;
  title: string | null;
  week_id: string;
};

export type ProgramExerciseRow = {
  day_id: string;
  exercise_library_id: string;
  id: string;
  notes: string | null;
  order_index: number | null;
  rest_seconds: number | null;
  target_reps: string | null;
  target_rpe: number | null;
  target_sets: number | null;
};

export type ExerciseLibraryRow = {
  id: string;
  media_items?: WorkoutExerciseMedia[] | null;
  name: string;
  primary_muscle: string | null;
  thumbnail_url?: string | null;
  video_id?: string | null;
  video_provider?: string | null;
  video_title?: string | null;
  video_url: string | null;
};

export type WorkoutExercise = {
  exercise: ExerciseLibraryRow;
  prescription: ProgramExerciseRow;
  source_exercise_key?: string | null;
};

export type WorkoutPlanForToday = {
  day: ProgramDay;
  enrollment: Enrollment;
  exercises: WorkoutExercise[];
  program: Program;
  source_day_key?: string | null;
  source_week_key?: string | null;
  week: ProgramWeek;
};

export type WorkoutSession = {
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  day_id: string | null;
  active_program_id: string | null;
  id: string;
  notes: string | null;
  program_id: string | null;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_program_version: string | null;
  source_week_key: string | null;
  started_at: string;
  user_id: string;
};

export type WorkoutSessionLookupInput =
  | {
      dayId: string;
      programId: string;
      userId: string;
      source?: "legacy" | null;
    }
  | {
      activeProgramId?: string | null;
      dayId?: null;
      programId?: null;
      source: "signal";
      sourceDayKey: string;
      sourceProgramId: string;
      sourceProgramVersion?: string | null;
      sourceWeekKey: string;
      userId: string;
    };

export type WorkoutSessionCreateInput = WorkoutSessionLookupInput;

export type SignalWorkoutSessionScope = {
  activeProgramId: string;
  sourceDayKey: string;
  sourceProgramId: string;
  sourceProgramVersion: string | null;
  sourceWeekKey: string;
};

export type SignalWorkoutSessionQueryInput = SignalWorkoutSessionScope & {
  userId: string;
};

export type WorkoutLogSet = {
  exercise_library_id: string | null;
  exercise_name?: string | null;
  id: string;
  logged_at: string;
  reps_completed: number | null;
  rpe_actual: number | null;
  session_id: string;
  set_number: number;
  source_exercise_key?: string | null;
  weight_kg: number | null;
};

export type ProgramExercisePreview = {
  name: string;
  notes: string | null;
  order_index: number | null;
  rest_seconds: number | null;
  target_reps: string | null;
  target_sets: number | null;
};

export type ProgramDayPreview = {
  day_number: number;
  id: string;
  title: string | null;
  week_id: string;
  exercises: ProgramExercisePreview[];
};

export type ProgramWeekPreview = {
  id: string;
  program_id: string;
  title: string | null;
  week_number: number;
  days: ProgramDayPreview[];
};

function toIsoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mondayBasedDayNumber(date: Date) {
  const day = date.getDay(); // 0=Sun .. 6=Sat
  return day === 0 ? 7 : day;
}

function daysBetween(fromIso: string, to: Date) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return 0;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
}

function isSignalWorkoutSessionInput(
  input: WorkoutSessionLookupInput,
): input is Extract<WorkoutSessionLookupInput, { source: "signal" }> {
  return input.source === "signal";
}

function workoutSessionSelect() {
  return "id,user_id,program_id,day_id,source,source_program_id,source_program_version,source_week_key,source_day_key,active_program_id,started_at,completed_at,cancelled_at,cancel_reason,notes";
}

function applySignalProgramVersionFilter<
  T extends {
    eq: (column: string, value: string) => T;
    is: (column: string, value: null) => T;
  },
>(query: T, sourceProgramVersion: string | null | undefined) {
  return sourceProgramVersion
    ? query.eq("source_program_version", sourceProgramVersion)
    : query.is("source_program_version", null);
}

export async function fetchWorkoutForToday(userId: string): Promise<WorkoutPlanForToday | null> {
  const activeEnrollmentRes = await supabase
    .from("enrollments")
    .select("id,user_id,program_id,status,stripe_subscription_id,enrolled_at,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeEnrollmentRes.error && activeEnrollmentRes.status !== 406) throw activeEnrollmentRes.error;
  const enrollment = (activeEnrollmentRes.data as Enrollment | null) ?? null;
  if (!enrollment) return null;

  const [programRes, weeksRes] = await Promise.all([
    supabase
      .from("programs")
      .select("id,creator_id,title,description,price,is_subscription,duration_weeks,difficulty,vibe_type,image_url,is_published,created_at")
      .eq("id", enrollment.program_id)
      .maybeSingle(),
    supabase
      .from("program_weeks")
      .select("id,program_id,week_number,title")
      .eq("program_id", enrollment.program_id)
      .order("week_number", { ascending: true }),
  ]);

  if (programRes.error && programRes.status !== 406) throw programRes.error;
  if (weeksRes.error) throw weeksRes.error;

  const program = (programRes.data as Program | null) ?? null;
  const weeks = (weeksRes.data as ProgramWeek[]) ?? [];
  if (!program || weeks.length === 0) return null;

  const today = new Date();
  const elapsedDays = daysBetween(enrollment.enrolled_at, today);
  const derivedWeek = Math.floor(elapsedDays / 7) + 1;
  const week = weeks.find((w) => w.week_number === derivedWeek) ?? weeks[0];

  const dayNumber = mondayBasedDayNumber(today);
  const daysRes = await supabase
    .from("program_days")
    .select("id,week_id,day_number,title")
    .eq("week_id", week.id)
    .order("day_number", { ascending: true });

  if (daysRes.error) throw daysRes.error;
  const days = (daysRes.data as ProgramDay[]) ?? [];
  if (days.length === 0) return null;

  const day = days.find((d) => d.day_number === dayNumber) ?? days[0];

  const exercisesRes = await supabase
    .from("program_exercises")
    .select("id,day_id,exercise_library_id,target_sets,target_reps,target_rpe,rest_seconds,notes,order_index")
    .eq("day_id", day.id)
    .order("order_index", { ascending: true });

  if (exercisesRes.error) throw exercisesRes.error;
  const prescriptionRows = (exercisesRes.data as ProgramExerciseRow[]) ?? [];

  if (prescriptionRows.length === 0) {
    return { day, enrollment, exercises: [], program, week };
  }

  const libIds = Array.from(new Set(prescriptionRows.map((row) => row.exercise_library_id)));
  const libraryRes = await supabase
    .from("exercises_library")
    .select("id,name,primary_muscle,video_url")
    .in("id", libIds);

  if (libraryRes.error) throw libraryRes.error;
  const libraryRows = (libraryRes.data as ExerciseLibraryRow[]) ?? [];
  const libraryMap = new Map(libraryRows.map((row) => [row.id, row]));

  const exercises = prescriptionRows
    .map((prescription) => {
      const exercise = libraryMap.get(prescription.exercise_library_id);
      if (!exercise) return null;
      return { exercise, prescription };
    })
    .filter((item): item is WorkoutExercise => Boolean(item));

  return { day, enrollment, exercises, program, week };
}

export async function getOrCreateWorkoutSession(input: WorkoutSessionCreateInput): Promise<WorkoutSession> {
  return getOrCreateWorkoutSessionInternal(input);
}

export async function findActiveWorkoutSession(input: WorkoutSessionLookupInput): Promise<WorkoutSession | null> {
  return findActiveWorkoutSessionInternal(input);
}

export async function findActiveSignalWorkoutSession(input: SignalWorkoutSessionQueryInput): Promise<WorkoutSession | null> {
  return findActiveWorkoutSessionInternal({
    activeProgramId: input.activeProgramId,
    dayId: null,
    programId: null,
    source: "signal",
    sourceDayKey: input.sourceDayKey,
    sourceProgramId: input.sourceProgramId,
    sourceProgramVersion: input.sourceProgramVersion,
    sourceWeekKey: input.sourceWeekKey,
    userId: input.userId,
  });
}

export async function getOrCreateSignalWorkoutSession(input: SignalWorkoutSessionQueryInput): Promise<WorkoutSession> {
  return getOrCreateWorkoutSessionInternal({
    activeProgramId: input.activeProgramId,
    dayId: null,
    programId: null,
    source: "signal",
    sourceDayKey: input.sourceDayKey,
    sourceProgramId: input.sourceProgramId,
    sourceProgramVersion: input.sourceProgramVersion,
    sourceWeekKey: input.sourceWeekKey,
    userId: input.userId,
  });
}

async function findLegacyOpenSignalWorkoutSession(input: SignalWorkoutSessionQueryInput): Promise<WorkoutSession | null> {
  const legacyRes = (await applySignalProgramVersionFilter(
    supabase
      .from("workout_sessions")
      .select(workoutSessionSelect())
      .eq("user_id", input.userId)
      .eq("source", "signal")
      .eq("source_program_id", input.sourceProgramId)
      .eq("source_week_key", input.sourceWeekKey)
      .eq("source_day_key", input.sourceDayKey)
      .is("completed_at", null)
      .is("cancelled_at", null)
      .order("started_at", { ascending: false })
      .limit(1),
    input.sourceProgramVersion ?? null,
  ).maybeSingle()) as { data: WorkoutSession | null; error: { message: string } | null; status: number };

  if (legacyRes.error && legacyRes.status !== 406) throw legacyRes.error;
  if (__DEV__) {
    console.log("[SignalSessionScope] legacy conflict lookup", {
      sessions: legacyRes.data ? [legacyRes.data] : [],
    });
  }
  return (legacyRes.data as WorkoutSession | null) ?? null;
}

export async function findAnyActiveWorkoutSession(userId: string): Promise<WorkoutSession | null> {
  const { data, error, status } = await supabase
    .from("workout_sessions")
    .select(workoutSessionSelect())
    .eq("user_id", userId)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && status !== 406) throw error;
  return (data as WorkoutSession | null) ?? null;
}

export async function findAnyOpenWorkoutSessionForStartup(
  userId: string,
): Promise<Pick<WorkoutSession, "completed_at" | "id" | "started_at" | "user_id"> | null> {
  const { data, error, status } = await supabase
    .from("workout_sessions")
    .select("id,user_id,started_at,completed_at")
    .eq("user_id", userId)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && status !== 406) throw error;
  return (data as Pick<WorkoutSession, "completed_at" | "id" | "started_at" | "user_id"> | null) ?? null;
}

export async function fetchWorkoutLogSets(sessionId: string): Promise<WorkoutLogSet[]> {
  const { data, error } = await supabase
    .from("workout_log_sets")
    .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .eq("session_id", sessionId)
    .order("set_number", { ascending: true })
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data as WorkoutLogSet[]) ?? [];
}

export async function completeSet(input: {
  exerciseLibraryId: string | null;
  exerciseName?: string | null;
  repsCompleted?: number | null;
  rpeActual?: number | null;
  sessionId: string;
  setNumber: number;
  sourceExerciseKey?: string | null;
  weightKg?: number | null;
}): Promise<WorkoutLogSet> {
  const useSignalIdentity = Boolean(input.sourceExerciseKey?.trim());
  const identityColumn = useSignalIdentity ? "source_exercise_key" : "exercise_library_id";
  const identityValue = useSignalIdentity ? input.sourceExerciseKey?.trim() ?? null : input.exerciseLibraryId;
  if (!identityValue) {
    throw new Error("Workout set identity is missing.");
  }
  const payload = {
    exercise_library_id: useSignalIdentity ? null : input.exerciseLibraryId,
    exercise_name: useSignalIdentity ? input.exerciseName ?? null : null,
    reps_completed: input.repsCompleted ?? null,
    rpe_actual: input.rpeActual ?? null,
    session_id: input.sessionId,
    set_number: input.setNumber,
    source_exercise_key: useSignalIdentity ? input.sourceExerciseKey?.trim() ?? null : null,
    weight_kg: input.weightKg ?? null,
  };

  if (__DEV__) {
    console.log("[workoutService.completeSet] payload", payload);
  }

  const existingRes = await supabase
    .from("workout_log_sets")
    .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .eq("session_id", input.sessionId)
    .eq(identityColumn, identityValue)
    .eq("set_number", input.setNumber)
    .maybeSingle();

  if (existingRes.error && existingRes.status !== 406) {
    console.log("[workoutService.completeSet] error", {
      code: existingRes.error.code ?? null,
      details: existingRes.error.details ?? null,
      hint: existingRes.error.hint ?? null,
      message: existingRes.error.message ?? null,
    });
    throw existingRes.error;
  }

  if (existingRes.data) {
    const updateRes = await supabase
      .from("workout_log_sets")
      .update(payload)
      .eq("id", existingRes.data.id)
      .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
      .single();

    if (updateRes.error) {
      console.log("[workoutService.completeSet] error", {
        code: updateRes.error.code ?? null,
        details: updateRes.error.details ?? null,
        hint: updateRes.error.hint ?? null,
        message: updateRes.error.message ?? null,
      });
      throw updateRes.error;
    }

    return updateRes.data as WorkoutLogSet;
  }

  const insertRes = await supabase
    .from("workout_log_sets")
    .insert(payload)
    .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
    .single();

  if (insertRes.error) {
    console.log("[workoutService.completeSet] error", {
      code: insertRes.error.code ?? null,
      details: insertRes.error.details ?? null,
      hint: insertRes.error.hint ?? null,
      message: insertRes.error.message ?? null,
    });
    throw insertRes.error;
  }
  return insertRes.data as WorkoutLogSet;
}

export async function finishWorkoutSession(sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("completed_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) {
    throw new Error("Workout completion could not be persisted because the active session is no longer available.");
  }
}

export async function discardWorkoutSession(
  sessionId: string,
): Promise<{ status: "discarded" | "not_found" | "already_completed" | "already_cancelled" }> {
  const { data: session, error: fetchError } = await supabase
    .from("workout_sessions")
    .select(
      "id, completed_at, cancelled_at, cancel_reason, source_program_id, source_program_version, source_day_key, source_week_key, user_id",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  console.log("[DiscardSoftCancel] before", {
    id: session?.id,
    completed_at: session?.completed_at,
    cancelled_at: session?.cancelled_at,
    cancel_reason: session?.cancel_reason,
    source_program_id: session?.source_program_id,
    source_program_version: session?.source_program_version,
    source_day_key: session?.source_day_key,
    source_week_key: session?.source_week_key,
    user_id: session?.user_id,
  });

  if (!session) {
    return { status: "not_found" };
  }

  if (session.completed_at !== null) {
    return { status: "already_completed" };
  }

  if (session.cancelled_at !== null) {
    return { status: "already_cancelled" };
  }

  const { data: deletedLogSetRows, error: logsError } = await supabase
    .from("workout_log_sets")
    .delete()
    .eq("session_id", sessionId)
    .select("id");

  console.log("[DiscardSoftCancel] delete log sets result", {
    count: Array.isArray(deletedLogSetRows) ? deletedLogSetRows.length : null,
    data: deletedLogSetRows ?? null,
    error: logsError
      ? {
          code: logsError.code ?? null,
          details: logsError.details ?? null,
          hint: logsError.hint ?? null,
          message: logsError.message ?? null,
          name: logsError.name ?? null,
        }
      : null,
    sessionId,
  });

  if (logsError) {
    console.warn("[DiscardSoftCancel] delete log sets failed but continuing", {
      error: {
        code: logsError.code ?? null,
        details: logsError.details ?? null,
        hint: logsError.hint ?? null,
        message: logsError.message ?? null,
        name: logsError.name ?? null,
      },
      sessionId,
    });
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("workout_sessions")
    .update({
      cancel_reason: "user_discarded",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .is("completed_at", null)
    .is("cancelled_at", null)
    .select("id,cancelled_at,cancel_reason");

  console.log("[DiscardSoftCancel] update result", {
    count: Array.isArray(updatedRows) ? updatedRows.length : null,
    data: updatedRows ?? null,
    error: updateError
      ? {
          code: updateError.code ?? null,
          details: updateError.details ?? null,
          hint: updateError.hint ?? null,
          message: updateError.message ?? null,
          name: updateError.name ?? null,
        }
      : null,
    sessionId,
  });
  if (updateError) throw updateError;

  const { data: remaining, error: verifyError } = await supabase
    .from("workout_sessions")
    .select("id, completed_at, cancelled_at, cancel_reason")
    .eq("id", sessionId)
    .maybeSingle();

  console.log("[DiscardSoftCancel] after", {
    remaining,
    sessionId,
  });

  if (verifyError) throw verifyError;
  if (!remaining || remaining.cancelled_at === null) {
    const discardVerifyError = new Error("discard_soft_cancel_failed");
    console.warn("[DiscardSoftCancel] failed", {
      remaining,
      sessionId,
    });
    throw discardVerifyError;
  }

  return { status: "discarded" };
}

export async function cancelOpenSignalWorkoutSessions(input: {
  activeProgramId?: string | null;
  sourceProgramId: string;
  sourceProgramVersion?: string | null;
  userId: string;
}): Promise<number> {
  let query = applySignalProgramVersionFilter(
    supabase
      .from("workout_sessions")
      .delete()
      .eq("user_id", input.userId)
      .eq("source", "signal")
      .eq("source_program_id", input.sourceProgramId)
      .is("completed_at", null)
      .is("cancelled_at", null),
    input.sourceProgramVersion ?? null,
  );

  if (input.activeProgramId) {
    query = query.eq("active_program_id", input.activeProgramId);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}

export async function clearUnfinishedSignalWorkoutSessionsForActiveProgram(input: {
  activeProgramId: string;
  userId: string;
}): Promise<{ logSetsDeleted: number; sessionsDeleted: number }> {
  const { data: sessions, error: fetchError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("active_program_id", input.activeProgramId)
    .eq("source", "signal")
    .is("completed_at", null)
    .is("cancelled_at", null);

  if (fetchError) throw fetchError;

  const sessionIds = ((sessions as { id: string }[] | null) ?? []).map((row) => row.id);
  if (sessionIds.length === 0) {
    console.log("[SignalSessionScope] reset enrollment cleanup", {
      activeProgramId: input.activeProgramId,
      logSetsDeleted: 0,
      sessionsDeleted: 0,
    });
    return { logSetsDeleted: 0, sessionsDeleted: 0 };
  }

  const { data: logSetRows, error: logSetsError } = await supabase
    .from("workout_log_sets")
    .delete()
    .in("session_id", sessionIds)
    .select("id");

  if (logSetsError) throw logSetsError;

  const { data: sessionRows, error: sessionDeleteError } = await supabase
    .from("workout_sessions")
    .delete()
    .in("id", sessionIds)
    .eq("user_id", input.userId)
    .eq("active_program_id", input.activeProgramId)
    .eq("source", "signal")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .select("id");

  if (sessionDeleteError) throw sessionDeleteError;

  const logSetsDeleted = Array.isArray(logSetRows) ? logSetRows.length : 0;
  const sessionsDeleted = Array.isArray(sessionRows) ? sessionRows.length : sessionIds.length;

  console.log("[SignalSessionScope] reset enrollment cleanup", {
    activeProgramId: input.activeProgramId,
    logSetsDeleted,
    sessionsDeleted,
  });

  return { logSetsDeleted, sessionsDeleted };
}

async function getOrCreateWorkoutSessionInternal(input: WorkoutSessionCreateInput): Promise<WorkoutSession> {
  if (isSignalWorkoutSessionInput(input)) {
    if (__DEV__) {
      console.log("[SignalSessionScope] lookup", {
        activeProgramId: input.activeProgramId ?? null,
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        userId: input.userId,
      });
      console.log("[SignalSessionScope] active lookup filters", {
        active_program_id: input.activeProgramId ?? null,
        cancelled_at: null,
        completed_at: null,
        source: "signal",
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        user_id: input.userId,
      });
    }

    const openRes = (await applySignalProgramVersionFilter(
      supabase
        .from("workout_sessions")
        .select(workoutSessionSelect())
        .eq("user_id", input.userId)
        .eq("active_program_id", input.activeProgramId ?? "")
        .eq("source", "signal")
        .eq("source_program_id", input.sourceProgramId)
        .eq("source_week_key", input.sourceWeekKey)
        .eq("source_day_key", input.sourceDayKey)
        .is("completed_at", null)
        .is("cancelled_at", null)
        .order("started_at", { ascending: false })
        .limit(1),
      input.sourceProgramVersion ?? null,
    ).maybeSingle()) as { data: WorkoutSession | null; error: { message: string } | null; status: number };

    if (openRes.error && openRes.status !== 406) throw openRes.error;
    if (openRes.data) return openRes.data as unknown as WorkoutSession;

    const legacyOpenSession = await findLegacyOpenSignalWorkoutSession({
      activeProgramId: input.activeProgramId ?? "",
      sourceDayKey: input.sourceDayKey,
      sourceProgramId: input.sourceProgramId,
      sourceProgramVersion: input.sourceProgramVersion ?? null,
      sourceWeekKey: input.sourceWeekKey,
      userId: input.userId,
    });

    if (legacyOpenSession) {
      if (legacyOpenSession.active_program_id === null) {
        const adoptionRes = await supabase
          .from("workout_sessions")
          .update({ active_program_id: input.activeProgramId ?? null })
          .eq("id", legacyOpenSession.id)
          .select(workoutSessionSelect())
          .single();

        if (adoptionRes.error) {
          console.log("[SignalSessionScope] insert error", {
            code: adoptionRes.error?.code ?? null,
            details: adoptionRes.error?.details ?? null,
            hint: adoptionRes.error?.hint ?? null,
            message: adoptionRes.error?.message ?? null,
            payload: {
              action: "adopt-legacy-open-session",
              active_program_id: input.activeProgramId ?? null,
              sessionId: legacyOpenSession.id,
            },
          });
          throw new Error(
            `Failed to adopt legacy Signal workout session: ${adoptionRes.error?.message ?? "Unknown Supabase error"}`,
          );
        }

        return adoptionRes.data as unknown as WorkoutSession;
      }

      console.warn("[SignalSessionScope] legacy open session belongs to another active program", {
        activeProgramId: input.activeProgramId ?? null,
        conflictSession: {
          active_program_id: legacyOpenSession.active_program_id,
          completed_at: legacyOpenSession.completed_at,
          id: legacyOpenSession.id,
          source_day_key: legacyOpenSession.source_day_key,
          source_program_id: legacyOpenSession.source_program_id,
          source_program_version: legacyOpenSession.source_program_version,
          source_week_key: legacyOpenSession.source_week_key,
        },
      });
    }

    const insertRes = await supabase
      .from("workout_sessions")
      .insert({
        active_program_id: input.activeProgramId ?? null,
        day_id: null,
        program_id: null,
        source: "signal",
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        user_id: input.userId,
      })
      .select(workoutSessionSelect())
      .single();

    if (insertRes.error) {
      const conflictSession = await findLegacyOpenSignalWorkoutSession({
        activeProgramId: input.activeProgramId ?? "",
        sourceDayKey: input.sourceDayKey,
        sourceProgramId: input.sourceProgramId,
        sourceProgramVersion: input.sourceProgramVersion ?? null,
        sourceWeekKey: input.sourceWeekKey,
        userId: input.userId,
      });
      const payload = {
        active_program_id: input.activeProgramId ?? null,
        day_id: null,
        program_id: null,
        source: "signal" as const,
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        user_id: input.userId,
      };
      console.log("[SignalSessionScope] insert error", {
        code: insertRes.error?.code ?? null,
        details: insertRes.error?.details ?? null,
        hint: insertRes.error?.hint ?? null,
        message: insertRes.error?.message ?? null,
        conflictSession,
        payload,
      });
      throw new Error(
        `Failed to create Signal workout session: ${insertRes.error?.message ?? "Unknown Supabase error"}`,
      );
    }
    return insertRes.data as unknown as WorkoutSession;
  }

  const openRes = await supabase
    .from("workout_sessions")
    .select(workoutSessionSelect())
    .eq("user_id", input.userId)
    .eq("program_id", input.programId ?? "")
    .eq("day_id", input.dayId ?? "")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openRes.error && openRes.status !== 406) throw openRes.error;
  if (openRes.data) return openRes.data as unknown as WorkoutSession;

  // One active session per day/program.
  const todayIso = toIsoDate(new Date());
  const dayStart = `${todayIso}T00:00:00.000Z`;
  const dayEnd = `${todayIso}T23:59:59.999Z`;
  const todayRes = await supabase
    .from("workout_sessions")
    .select(workoutSessionSelect())
    .eq("user_id", input.userId)
    .eq("program_id", input.programId ?? "")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (todayRes.error && todayRes.status !== 406) throw todayRes.error;
  if (todayRes.data) return todayRes.data as unknown as WorkoutSession;

  const insertRes = await supabase
    .from("workout_sessions")
    .insert({
      day_id: input.dayId,
      program_id: input.programId,
      user_id: input.userId,
    })
    .select(workoutSessionSelect())
    .single();

  if (insertRes.error) throw insertRes.error;
  return insertRes.data as unknown as WorkoutSession;
}

async function findActiveWorkoutSessionInternal(input: WorkoutSessionLookupInput): Promise<WorkoutSession | null> {
  if (isSignalWorkoutSessionInput(input)) {
    if (__DEV__) {
      console.log("[SignalSessionScope] lookup", {
        activeProgramId: input.activeProgramId ?? null,
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        userId: input.userId,
      });
      console.log("[SignalSessionScope] active lookup filters", {
        active_program_id: input.activeProgramId ?? null,
        cancelled_at: null,
        completed_at: null,
        source: "signal",
        source_day_key: input.sourceDayKey,
        source_program_id: input.sourceProgramId,
        source_program_version: input.sourceProgramVersion ?? null,
        source_week_key: input.sourceWeekKey,
        user_id: input.userId,
      });
    }

    const openRes = (await applySignalProgramVersionFilter(
      supabase
        .from("workout_sessions")
        .select(workoutSessionSelect())
        .eq("user_id", input.userId)
        .eq("active_program_id", input.activeProgramId ?? "")
        .eq("source", "signal")
        .eq("source_program_id", input.sourceProgramId)
        .eq("source_week_key", input.sourceWeekKey)
        .eq("source_day_key", input.sourceDayKey)
        .is("completed_at", null)
        .is("cancelled_at", null)
        .order("started_at", { ascending: false })
        .limit(1),
      input.sourceProgramVersion ?? null,
    ).maybeSingle()) as { data: WorkoutSession | null; error: { message: string } | null; status: number };

    if (openRes.error && openRes.status !== 406) throw openRes.error;
    if (__DEV__) {
      console.log("[SignalSessionScope] result", {
        active_program_id: openRes.data?.active_program_id ?? null,
        completed_at: openRes.data?.completed_at ?? null,
        sessionId: openRes.data?.id ?? null,
        source_program_id: openRes.data?.source_program_id ?? null,
        source_program_version: openRes.data?.source_program_version ?? null,
      });
    }
    return (openRes.data as unknown as WorkoutSession | null) ?? null;
  }

  const openRes = await supabase
    .from("workout_sessions")
    .select(workoutSessionSelect())
    .eq("user_id", input.userId)
    .eq("program_id", input.programId ?? "")
    .eq("day_id", input.dayId ?? "")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openRes.error && openRes.status !== 406) throw openRes.error;
  if (openRes.data) return openRes.data as unknown as WorkoutSession;

  const todayIso = toIsoDate(new Date());
  const dayStart = `${todayIso}T00:00:00.000Z`;
  const dayEnd = `${todayIso}T23:59:59.999Z`;
  const todayRes = await supabase
    .from("workout_sessions")
    .select(workoutSessionSelect())
    .eq("user_id", input.userId)
    .eq("program_id", input.programId ?? "")
    .is("completed_at", null)
    .is("cancelled_at", null)
    .gte("started_at", dayStart)
    .lte("started_at", dayEnd)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (todayRes.error && todayRes.status !== 406) throw todayRes.error;
  return (todayRes.data as unknown as WorkoutSession | null) ?? null;
}

export async function fetchProgramStructure(programId: string): Promise<ProgramWeekPreview[]> {
  const weeksRes = await supabase
    .from("program_weeks")
    .select("id,program_id,week_number,title")
    .eq("program_id", programId)
    .order("week_number", { ascending: true });
  if (weeksRes.error) throw weeksRes.error;
  const weeks = (weeksRes.data as ProgramWeek[]) ?? [];
  if (!weeks.length) return [];

  const weekIds = weeks.map((w) => w.id);
  const daysRes = await supabase
    .from("program_days")
    .select("id,week_id,day_number,title")
    .in("week_id", weekIds)
    .order("day_number", { ascending: true });
  if (daysRes.error) throw daysRes.error;
  const days = (daysRes.data as ProgramDay[]) ?? [];
  if (!days.length) {
    return weeks.map((w) => ({ ...w, days: [] }));
  }

  const dayIds = days.map((d) => d.id);
  const exercisesRes = await supabase
    .from("program_exercises")
    .select("id,day_id,exercise_library_id,target_sets,target_reps,target_rpe,rest_seconds,notes,order_index")
    .in("day_id", dayIds)
    .order("order_index", { ascending: true });
  if (exercisesRes.error) throw exercisesRes.error;
  const prescriptions = (exercisesRes.data as ProgramExerciseRow[]) ?? [];

  const libraryIds = Array.from(new Set(prescriptions.map((p) => p.exercise_library_id)));
  const libraryMap = new Map<string, ExerciseLibraryRow>();
  if (libraryIds.length) {
    const libraryRes = await supabase
      .from("exercises_library")
      .select("id,name,primary_muscle,video_url")
      .in("id", libraryIds);
    if (libraryRes.error) throw libraryRes.error;
    ((libraryRes.data as ExerciseLibraryRow[]) ?? []).forEach((row) => {
      libraryMap.set(row.id, row);
    });
  }

  const exercisesByDay = new Map<string, ProgramExercisePreview[]>();
  prescriptions.forEach((p) => {
    const lib = libraryMap.get(p.exercise_library_id);
    const row: ProgramExercisePreview = {
      name: lib?.name ?? "Exercise",
      notes: p.notes,
      order_index: p.order_index,
      rest_seconds: p.rest_seconds,
      target_reps: p.target_reps,
      target_sets: p.target_sets,
    };
    const current = exercisesByDay.get(p.day_id) ?? [];
    current.push(row);
    exercisesByDay.set(p.day_id, current);
  });

  const daysByWeek = new Map<string, ProgramDayPreview[]>();
  days.forEach((d) => {
    const row: ProgramDayPreview = {
      day_number: d.day_number,
      id: d.id,
      title: d.title,
      week_id: d.week_id,
      exercises: exercisesByDay.get(d.id) ?? [],
    };
    const current = daysByWeek.get(d.week_id) ?? [];
    current.push(row);
    daysByWeek.set(d.week_id, current);
  });

  return weeks.map((w) => ({
    ...w,
    days: (daysByWeek.get(w.id) ?? []).sort((a, b) => a.day_number - b.day_number),
  }));
}
