import { supabase } from "@/src/lib/supabase";

import {
  applySignalProgramVersionFilter,
  workoutSessionSelect,
} from "./workoutSession.shared";
import type {
  SignalWorkoutSessionQueryInput,
  WorkoutSession,
} from "./workoutTypes";

type InternalSignalWorkoutSessionInput = Omit<SignalWorkoutSessionQueryInput, "activeProgramId"> & {
  activeProgramId?: string | null;
};

export async function findActiveSignalWorkoutSession(input: SignalWorkoutSessionQueryInput): Promise<WorkoutSession | null> {
  return findActiveSignalWorkoutSessionInternal({
    activeProgramId: input.activeProgramId,
    sourceDayKey: input.sourceDayKey,
    sourceProgramId: input.sourceProgramId,
    sourceProgramVersion: input.sourceProgramVersion,
    sourceWeekKey: input.sourceWeekKey,
    userId: input.userId,
  });
}

export async function getOrCreateSignalWorkoutSession(input: SignalWorkoutSessionQueryInput): Promise<WorkoutSession> {
  return getOrCreateSignalWorkoutSessionInternal({
    activeProgramId: input.activeProgramId,
    sourceDayKey: input.sourceDayKey,
    sourceProgramId: input.sourceProgramId,
    sourceProgramVersion: input.sourceProgramVersion,
    sourceWeekKey: input.sourceWeekKey,
    userId: input.userId,
  });
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

export async function findActiveSignalWorkoutSessionInternal(input: InternalSignalWorkoutSessionInput): Promise<WorkoutSession | null> {
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

async function findLegacyOpenSignalWorkoutSession(input: InternalSignalWorkoutSessionInput): Promise<WorkoutSession | null> {
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

export async function getOrCreateSignalWorkoutSessionInternal(input: InternalSignalWorkoutSessionInput): Promise<WorkoutSession> {
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
