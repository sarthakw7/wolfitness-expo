import { supabase } from "@/src/lib/supabase";

export type ActiveProgramStatus = "active" | "paused" | "completed" | "replaced";
export type ActiveProgramSource = "legacy" | "signal";

export type ActiveProgramRow = {
  completed_at: string | null;
  current_day_key: string | null;
  current_week_key: string | null;
  id: string;
  last_completed_session_id: string | null;
  legacy_day_id: string | null;
  legacy_program_id: string | null;
  legacy_week_id: string | null;
  replaced_at: string | null;
  source: ActiveProgramSource;
  source_program_id: string;
  source_program_version: string | null;
  started_at: string;
  status: ActiveProgramStatus;
  updated_at: string;
  user_id: string;
};

export type StartSignalProgramInput = {
  firstDayKey: string;
  firstWeekKey: string;
  signalProgramId: string;
  signalProgramVersion?: string | null;
  userId: string;
};

export type AdvanceActiveProgramInput = {
  activeProgramId: string;
  completedSessionId: string;
  isProgramCompleted?: boolean;
  nextDayKey?: string | null;
  nextWeekKey?: string | null;
  userId: string;
};

export async function getActiveProgram(userId: string): Promise<ActiveProgramRow | null> {
  const { data, error, status } = await supabase
    .from("active_programs")
    .select(
      "id,user_id,source,source_program_id,source_program_version,current_week_key,current_day_key,status,started_at,last_completed_session_id,completed_at,replaced_at,updated_at,legacy_program_id,legacy_week_id,legacy_day_id",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && status !== 406) throw error;
  return (data as ActiveProgramRow | null) ?? null;
}

export async function startSignalProgram(input: StartSignalProgramInput): Promise<ActiveProgramRow> {
  const { data, error } = await supabase.rpc("start_signal_program", {
    p_current_day_key: input.firstDayKey,
    p_current_week_key: input.firstWeekKey,
    p_signal_program_id: input.signalProgramId,
    p_signal_program_version: input.signalProgramVersion ?? null,
    p_user_id: input.userId,
  });

  if (error) throw error;
  return data as ActiveProgramRow;
}

export async function continueActiveProgram(userId: string): Promise<
  Pick<
    ActiveProgramRow,
    | "id"
    | "source"
    | "source_program_id"
    | "source_program_version"
    | "current_week_key"
    | "current_day_key"
    | "status"
  > | null
> {
  const activeProgram = await getActiveProgram(userId);
  if (!activeProgram) return null;

  return {
    current_day_key: activeProgram.current_day_key,
    current_week_key: activeProgram.current_week_key,
    id: activeProgram.id,
    source: activeProgram.source,
    source_program_id: activeProgram.source_program_id,
    source_program_version: activeProgram.source_program_version,
    status: activeProgram.status,
  };
}

export async function advanceActiveProgramAfterWorkout(input: AdvanceActiveProgramInput): Promise<ActiveProgramRow> {
  const updatePayload = input.isProgramCompleted
    ? {
        completed_at: new Date().toISOString(),
        last_completed_session_id: input.completedSessionId,
        status: "completed",
      }
    : {
        current_day_key: input.nextDayKey ?? null,
        current_week_key: input.nextWeekKey ?? null,
        last_completed_session_id: input.completedSessionId,
      };

  const { data, error } = await supabase
    .from("active_programs")
    .update(updatePayload)
    .eq("id", input.activeProgramId)
    .eq("user_id", input.userId)
    .select(
      "id,user_id,source,source_program_id,source_program_version,current_week_key,current_day_key,status,started_at,last_completed_session_id,completed_at,replaced_at,updated_at,legacy_program_id,legacy_week_id,legacy_day_id",
    )
    .single();

  if (error) throw error;
  return data as ActiveProgramRow;
}
