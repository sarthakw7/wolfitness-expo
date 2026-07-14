import { calculateWorkoutSummary } from "@/src/features/workout-summary/lib/calculateWorkoutSummary";
import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";
import {
  calculateDurationMinutes,
  formatFallbackTitle,
  formatSignalWorkoutSubtitle,
  getWorkoutLogIdentityKey,
  logProgress,
} from "@/src/services/progress/progress.shared";
import type {
  WorkoutSessionDetail,
  WorkoutSessionDetailExerciseGroup,
} from "@/src/services/progress/progressTypes";

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

type WorkoutSessionDetailSessionRow = {
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

type WorkoutSessionDetailTitleRow = {
  id: string;
  title: string | null;
};

type ExerciseLibraryTitleRow = {
  id: string;
  name: string | null;
};

function formatExerciseFallback(exerciseId: string) {
  const shortId = exerciseId.slice(0, 8);
  return `Exercise ${shortId}`;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchWorkoutSessionDetail(
  userId: string,
  sessionId: string,
): Promise<WorkoutSessionDetail | null> {
  try {
    assertSupabaseConfigured();

    const sessionRes = await supabase
      .from("workout_sessions")
      .select("id,program_id,day_id,source,source_program_id,source_week_key,source_day_key,started_at,completed_at,notes")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .maybeSingle();

    if (sessionRes.error && sessionRes.status !== 406) throw sessionRes.error;

    const session = (sessionRes.data as WorkoutSessionDetailSessionRow | null) ?? null;
    if (!session) return null;

    const logsRes = await supabase
      .from("workout_log_sets")
      .select("id,session_id,exercise_library_id,source_exercise_key,exercise_name,set_number,reps_completed,weight_kg,rpe_actual,logged_at")
      .eq("session_id", sessionId)
      .order("source_exercise_key", { ascending: true })
      .order("exercise_library_id", { ascending: true })
      .order("set_number", { ascending: true })
      .order("logged_at", { ascending: true });

    if (logsRes.error) throw logsRes.error;

    const [programRes, dayRes] = await Promise.all([
      session.program_id
        ? supabase.from("programs").select("id,title").eq("id", session.program_id).maybeSingle()
        : Promise.resolve({ data: null, error: null, status: 406 } as const),
      session.day_id
        ? supabase.from("program_days").select("id,title").eq("id", session.day_id).maybeSingle()
        : Promise.resolve({ data: null, error: null, status: 406 } as const),
    ]);

    if (programRes.error && programRes.status !== 406) throw programRes.error;
    if (dayRes.error && dayRes.status !== 406) throw dayRes.error;

    const logs = (logsRes.data ?? []) as WorkoutLogSetRow[];
    const exerciseIds = Array.from(new Set(logs.map((log) => getWorkoutLogIdentityKey(log)))).filter(isUuidLike);
    const exerciseLibraryRes = exerciseIds.length
      ? await supabase.from("exercises_library").select("id,name").in("id", exerciseIds)
      : { data: [], error: null };

    if (exerciseLibraryRes.error) throw exerciseLibraryRes.error;

    const exerciseTitles = new Map(
      ((exerciseLibraryRes.data ?? []) as ExerciseLibraryTitleRow[]).map((row) => [
        row.id,
        row.name ?? formatExerciseFallback(row.id),
      ]),
    );

    const groupedExercises = new Map<string, WorkoutSessionDetailExerciseGroup>();
    logs.forEach((log) => {
      const exerciseId = getWorkoutLogIdentityKey(log);
      const existing = groupedExercises.get(exerciseId);
      const nextSet = {
        id: log.id,
        loggedAt: log.logged_at,
        repsCompleted: log.reps_completed,
        rpeActual: log.rpe_actual,
        setNumber: log.set_number,
        weightKg: log.weight_kg,
      };

      if (existing) {
        existing.sets.push(nextSet);
        return;
      }

      groupedExercises.set(exerciseId, {
        exerciseId,
        exerciseLabel:
          log.exercise_name ??
          exerciseTitles.get(log.exercise_library_id ?? "") ??
          formatExerciseFallback(exerciseId),
        sets: [nextSet],
      });
    });

    const isSignal = session.source === "signal";
    const programTitle =
      isSignal
        ? "Signal Workout"
        : formatFallbackTitle((programRes.data as WorkoutSessionDetailTitleRow | null)?.title, "Legacy Workout");
    const dayTitle =
      isSignal
        ? formatSignalWorkoutSubtitle(session)
        : formatFallbackTitle((dayRes.data as WorkoutSessionDetailTitleRow | null)?.title, session.day_id ?? "Day unavailable");

    return {
      completedAt: session.completed_at,
      dayLabel: dayTitle,
      durationMinutes: calculateDurationMinutes(session.started_at, session.completed_at),
      exerciseCount: groupedExercises.size,
      groupedExercises: Array.from(groupedExercises.values()),
      id: session.id,
      programLabel: isSignal ? "Signal Program" : programTitle,
      summary: calculateWorkoutSummary({
        session: {
          completed_at: session.completed_at,
          notes: session.notes ?? null,
          started_at: session.started_at,
        },
        sets: logs,
      }),
      setCount: logs.length,
      source: session.source,
      sourceDayKey: session.source_day_key,
      sourceProgramId: session.source_program_id,
      sourceWeekKey: session.source_week_key,
      startedAt: session.started_at,
      title: programTitle,
    };
  } catch (error) {
    logProgress("error", "Failed to load workout session detail.", {
      error: error instanceof Error ? error.message : String(error),
      sessionId,
      userId,
    });
    throw error;
  }
}
