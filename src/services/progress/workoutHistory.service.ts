import { calculateWorkoutSummary } from "@/src/features/workout-summary/lib/calculateWorkoutSummary";
import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";
import {
  formatFallbackTitle,
  formatSignalWorkoutSubtitle,
  getWorkoutLogIdentityKey,
  logProgress,
} from "@/src/services/progress/progress.shared";
import type { WorkoutHistoryRow } from "@/src/services/progress/progressTypes";

type WorkoutLogSetRow = {
  exercise_name: string | null;
  logged_at: string;
  exercise_library_id: string | null;
  id: string;
  reps_completed: number | null;
  rpe_actual: number | null;
  session_id: string;
  set_number: number;
  source_exercise_key: string | null;
  weight_kg: number | null;
};

type WorkoutHistorySessionRow = {
  completed_at: string | null;
  day_id: string | null;
  id: string;
  notes: string | null;
  program_id: string | null;
  source: "legacy" | "signal" | null;
  source_day_key: string | null;
  source_program_id: string | null;
  source_week_key: string | null;
  started_at: string;
};

type WorkoutHistoryTitleRow = {
  id: string;
  title: string | null;
};

function formatSignalWorkoutTitle(row: WorkoutHistorySessionRow) {
  return "Signal Workout";
}

function formatLegacyWorkoutTitle(
  row: WorkoutHistorySessionRow,
  programTitles: Map<string, string>,
  dayTitles: Map<string, string>,
) {
  const programTitle = row.program_id ? programTitles.get(row.program_id) : null;
  return formatFallbackTitle(programTitle, "Legacy Workout");
}

function formatLegacyWorkoutSubtitle(
  row: WorkoutHistorySessionRow,
  dayTitles: Map<string, string>,
) {
  const dayTitle = row.day_id ? dayTitles.get(row.day_id) : null;
  return formatFallbackTitle(dayTitle, row.day_id ?? "Day unavailable");
}

export async function fetchWorkoutHistory(userId: string, limit = 20): Promise<WorkoutHistoryRow[]> {
  try {
    assertSupabaseConfigured();

    const sessionsRes = await supabase
      .from("workout_sessions")
      .select("id,program_id,day_id,source,source_program_id,source_week_key,source_day_key,started_at,completed_at,notes")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (sessionsRes.error) throw sessionsRes.error;

    const sessions = (sessionsRes.data ?? []) as WorkoutHistorySessionRow[];
    if (!sessions.length) return [];

    const sessionIds = sessions.map((session) => session.id);
    const allLogsRes = await supabase
      .from("workout_log_sets")
      .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,reps_completed,rpe_actual,weight_kg,set_number,logged_at")
      .in("session_id", sessionIds);

    if (allLogsRes.error) throw allLogsRes.error;

    const legacyProgramIds = Array.from(
      new Set(
        sessions
          .filter((session) => session.source !== "signal")
          .map((session) => session.program_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const legacyDayIds = Array.from(
      new Set(
        sessions
          .filter((session) => session.source !== "signal")
          .map((session) => session.day_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const [programTitlesRes, dayTitlesRes] = await Promise.all([
      legacyProgramIds.length
        ? supabase.from("programs").select("id,title").in("id", legacyProgramIds)
        : Promise.resolve({ data: [], error: null } as const),
      legacyDayIds.length
        ? supabase.from("program_days").select("id,title").in("id", legacyDayIds)
        : Promise.resolve({ data: [], error: null } as const),
    ]);

    if (programTitlesRes.error && programTitlesRes.status !== 406) throw programTitlesRes.error;
    if (dayTitlesRes.error && dayTitlesRes.status !== 406) throw dayTitlesRes.error;

    const programTitles = new Map(
      ((programTitlesRes.data ?? []) as WorkoutHistoryTitleRow[]).map((row) => [row.id, row.title ?? "Legacy Workout"]),
    );
    const dayTitles = new Map(
      ((dayTitlesRes.data ?? []) as WorkoutHistoryTitleRow[]).map((row) => [row.id, row.title ?? "Day unavailable"]),
    );
    const logs = (allLogsRes.data ?? []) as WorkoutLogSetRow[];
    const logsBySession = new Map<string, { exerciseIds: Set<string>; logs: WorkoutLogSetRow[]; setCount: number }>();

    sessionIds.forEach((sessionId) => {
      logsBySession.set(sessionId, { exerciseIds: new Set<string>(), logs: [], setCount: 0 });
    });

    logs.forEach((log) => {
      const bucket = logsBySession.get(log.session_id);
      if (!bucket) return;
      bucket.setCount += 1;
      bucket.exerciseIds.add(getWorkoutLogIdentityKey(log));
      bucket.logs.push(log);
    });

    return sessions.map((session) => {
      const bucket = logsBySession.get(session.id) ?? { exerciseIds: new Set<string>(), setCount: 0 };
      const summary = calculateWorkoutSummary({
        session: {
          completed_at: session.completed_at,
          notes: session.notes ?? null,
          started_at: session.started_at,
        },
        sets: (logsBySession.get(session.id)?.logs ?? []) as WorkoutLogSetRow[],
      });
      const isSignal = session.source === "signal";

      return {
        completedAt: session.completed_at ?? session.started_at,
        dayId: session.day_id,
        dayLabel: isSignal
          ? formatSignalWorkoutSubtitle(session)
          : formatLegacyWorkoutSubtitle(session, dayTitles),
        exerciseCount: bucket.exerciseIds.size,
        id: session.id,
        programId: session.program_id,
        programLabel: isSignal
          ? "Signal Program"
          : formatLegacyWorkoutTitle(session, programTitles, dayTitles),
        summary,
        setCount: bucket.setCount,
        source: session.source,
        sourceDayKey: session.source_day_key,
        sourceProgramId: session.source_program_id,
        sourceWeekKey: session.source_week_key,
        startedAt: session.started_at,
        subtitle: isSignal
          ? formatSignalWorkoutSubtitle(session)
          : formatLegacyWorkoutSubtitle(session, dayTitles),
        title: isSignal ? formatSignalWorkoutTitle(session) : formatLegacyWorkoutTitle(session, programTitles, dayTitles),
      };
    });
  } catch (error) {
    logProgress("error", "Failed to load workout history.", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw error;
  }
}
