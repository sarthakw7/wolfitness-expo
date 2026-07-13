import { toIsoDate } from "@/src/lib/date";
import { supabase } from "@/src/lib/supabase";

import {
  findActiveSignalWorkoutSessionInternal,
  getOrCreateSignalWorkoutSessionInternal,
} from "./signalWorkoutSession.service";
import { isSignalWorkoutSessionInput, workoutSessionSelect } from "./workoutSession.shared";
import type {
  WorkoutSession,
  WorkoutSessionCreateInput,
  WorkoutSessionLookupInput,
} from "./workoutTypes";

export async function getOrCreateWorkoutSession(input: WorkoutSessionCreateInput): Promise<WorkoutSession> {
  if (isSignalWorkoutSessionInput(input)) {
    return getOrCreateSignalWorkoutSessionInternal({
      activeProgramId: input.activeProgramId,
      sourceDayKey: input.sourceDayKey,
      sourceProgramId: input.sourceProgramId,
      sourceProgramVersion: input.sourceProgramVersion ?? null,
      sourceWeekKey: input.sourceWeekKey,
      userId: input.userId,
    });
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

export async function findActiveWorkoutSession(input: WorkoutSessionLookupInput): Promise<WorkoutSession | null> {
  if (isSignalWorkoutSessionInput(input)) {
    return findActiveSignalWorkoutSessionInternal({
      activeProgramId: input.activeProgramId,
      sourceDayKey: input.sourceDayKey,
      sourceProgramId: input.sourceProgramId,
      sourceProgramVersion: input.sourceProgramVersion ?? null,
      sourceWeekKey: input.sourceWeekKey,
      userId: input.userId,
    });
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
