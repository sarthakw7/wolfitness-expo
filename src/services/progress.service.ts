import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { logProgress } from "@/src/services/progress/progress.shared";
import type {
  SignalCompletedWorkoutSessionRow,
  SignalProgramLifecycleProgressRow,
  SignalProgramProgressSnapshot,
} from "@/src/services/progress/progressTypes";

export * from "@/src/services/progress/progressTypes";
export { fetchProgressOverview } from "@/src/services/progress/progressOverview.service";
export { fetchWorkoutHistory } from "@/src/services/progress/workoutHistory.service";
export { fetchWorkoutSessionDetail } from "@/src/services/progress/workoutSessionDetail.service";

export async function fetchSignalProgramProgress(userId: string): Promise<SignalProgramProgressSnapshot | null> {
  try {
    assertSupabaseConfigured();

    const activeLifecycleRes = await supabase
      .from("active_programs")
      .select(
        "id,user_id,source,source_program_id,source_program_version,current_week_key,current_day_key,status,started_at,completed_at,replaced_at,updated_at",
      )
      .eq("user_id", userId)
      .eq("source", "signal")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeLifecycleRes.error && activeLifecycleRes.status !== 406) throw activeLifecycleRes.error;
    const fallbackLifecycleRes = activeLifecycleRes.data
      ? null
      : await supabase
          .from("active_programs")
          .select(
            "id,user_id,source,source_program_id,source_program_version,current_week_key,current_day_key,status,started_at,completed_at,replaced_at,updated_at",
          )
          .eq("user_id", userId)
          .eq("source", "signal")
          .in("status", ["completed", "replaced", "paused"])
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (fallbackLifecycleRes?.error && fallbackLifecycleRes.status !== 406) throw fallbackLifecycleRes.error;

    const lifecycle = (activeLifecycleRes.data ?? fallbackLifecycleRes?.data ?? null) as SignalProgramLifecycleProgressRow | null;
    if (!lifecycle) return null;

    let sessionsQuery = supabase
      .from("workout_sessions")
      .select("id,completed_at,active_program_id,source,source_program_id,source_program_version,source_week_key,source_day_key")
      .eq("user_id", userId)
      .eq("source", "signal")
      .eq("active_program_id", lifecycle.id)
      .eq("source_program_id", lifecycle.source_program_id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    sessionsQuery = lifecycle.source_program_version
      ? sessionsQuery.eq("source_program_version", lifecycle.source_program_version)
      : sessionsQuery.is("source_program_version", null);

    const sessionsRes = await sessionsQuery;

    if (sessionsRes.error) throw sessionsRes.error;

    const completedSessions = (sessionsRes.data ?? []) as SignalCompletedWorkoutSessionRow[];

    return {
      completedSessions,
      lifecycle,
    };
  } catch (error) {
    logProgress("error", "Failed to fetch Signal program progress.", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}
