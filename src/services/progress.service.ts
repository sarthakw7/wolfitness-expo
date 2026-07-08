import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type ProgressRange = "7d" | "30d";

export type SignalProgramLifecycleProgressRow = {
  completed_at: string | null;
  current_day_key: string | null;
  current_week_key: string | null;
  id: string;
  replaced_at: string | null;
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
  source_program_version: string | null;
  source_week_key: string | null;
};

export type SignalProgramProgressSnapshot = {
  completedSessions: SignalCompletedWorkoutSessionRow[];
  lifecycle: SignalProgramLifecycleProgressRow | null;
};

export type WorkoutHistoryRow = {
  completedAt: string;
  dayId: string | null;
  dayLabel: string;
  exerciseCount: number;
  id: string;
  programId: string | null;
  programLabel: string;
  setCount: number;
  source: "legacy" | "signal" | null;
  sourceDayKey: string | null;
  sourceProgramId: string | null;
  sourceWeekKey: string | null;
  startedAt: string;
  subtitle: string;
  title: string;
};

export type WorkoutSessionDetailSetRow = {
  id: string;
  loggedAt: string;
  repsCompleted: number | null;
  rpeActual: number | null;
  setNumber: number;
  weightKg: number | null;
};

export type WorkoutSessionDetailExerciseGroup = {
  exerciseId: string;
  exerciseLabel: string;
  sets: WorkoutSessionDetailSetRow[];
};

export type WorkoutSessionDetail = {
  completedAt: string | null;
  dayLabel: string;
  durationMinutes: number | null;
  exerciseCount: number;
  groupedExercises: WorkoutSessionDetailExerciseGroup[];
  id: string;
  programLabel: string;
  setCount: number;
  source: "legacy" | "signal" | null;
  sourceDayKey: string | null;
  sourceProgramId: string | null;
  sourceWeekKey: string | null;
  startedAt: string;
  title: string;
};

type CompletedWorkoutSessionRow = {
  completed_at: string | null;
  day_id: string | null;
  id: string;
  program_id: string | null;
  started_at: string;
};

type WorkoutLogSetRow = {
  logged_at: string;
  exercise_library_id: string | null;
  exercise_name: string | null;
  reps_completed: number | null;
  session_id: string;
  source_exercise_key: string | null;
  weight_kg: number | null;
};

type WorkoutHistorySessionRow = {
  completed_at: string | null;
  day_id: string | null;
  id: string;
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

type ExerciseLibraryTitleRow = {
  id: string;
  name: string | null;
};

type DailyNutritionSummaryRow = {
  date: string;
  total_calories: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  total_protein: number | null;
};

type MacroTargetsRow = {
  daily_calorie_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  daily_protein_target: number;
};

export type ProgressTrendPoint = {
  date: string;
  percentOfTarget: number;
  target: number | null;
  value: number;
};

export type RecentProgressSession = {
  completedAt: string;
  dayId: string | null;
  durationMinutes: number | null;
  id: string;
  programId: string | null;
  startedAt: string;
  volume: number;
};

export type ProgressOverview = {
  calorieTrend: ProgressTrendPoint[];
  consistencyPercent: number;
  currentStreak: number;
  nutritionAdherence: {
    calorieAveragePercent: number;
    daysWithNutrition: number;
    proteinAveragePercent: number;
  };
  proteinTrend: ProgressTrendPoint[];
  range: ProgressRange;
  recentSessions: RecentProgressSession[];
  weeklyVolume: number;
  weeklyWorkoutCount: number;
};

function logProgress(level: "error" | "info" | "warn", message: string, context?: Record<string, unknown>) {
  console[level]("[progress]", message, context ?? {});
}

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseIsoDate(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function rangeDays(range: ProgressRange) {
  return range === "30d" ? 30 : 7;
}

function startOfRangeIso(range: ProgressRange, endDate = new Date()) {
  return toIsoDate(addDays(endDate, -(rangeDays(range) - 1)));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function percentOfTarget(value: number, target: number | null | undefined) {
  if (!target || target <= 0) return 0;
  return clampPercent(value / target);
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function uniqueDateSet(dates: string[]) {
  return new Set(dates.map((date) => date.slice(0, 10)));
}

function calculateCurrentStreak(completedDates: Set<string>, fromDate = new Date()) {
  let streak = 0;
  let cursor = parseIsoDate(toIsoDate(fromDate));

  while (completedDates.has(toIsoDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function calculateDurationMinutes(startedAt: string, completedAt: string | null) {
  if (!completedAt) return null;

  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed) || completed <= started) return null;

  return Math.round((completed - started) / (1000 * 60));
}

function buildTrend(
  summaries: DailyNutritionSummaryRow[],
  startIso: string,
  days: number,
  kind: "calories" | "protein",
  target: number | null,
): ProgressTrendPoint[] {
  const summaryByDate = new Map(summaries.map((summary) => [summary.date, summary]));
  const start = parseIsoDate(startIso);

  return Array.from({ length: days }, (_, index) => {
    const date = toIsoDate(addDays(start, index));
    const summary = summaryByDate.get(date);
    const value =
      kind === "calories" ? safeNumber(summary?.total_calories) : safeNumber(summary?.total_protein);

    return {
      date,
      percentOfTarget: percentOfTarget(value, target),
      target,
      value,
    };
  });
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatFallbackTitle(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return value;
}

function formatSignalWorkoutTitle(row: WorkoutHistorySessionRow) {
  return "Signal Workout";
}

function formatSignalWorkoutSubtitle(row: WorkoutHistorySessionRow) {
  const week = row.source_week_key ? `Week ${row.source_week_key}` : "Week unavailable";
  const day = row.source_day_key ? `Day ${row.source_day_key}` : "Day unavailable";
  return `${week} · ${day}`;
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

function formatExerciseFallback(exerciseId: string) {
  const shortId = exerciseId.slice(0, 8);
  return `Exercise ${shortId}`;
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getWorkoutLogIdentityKey(log: Pick<WorkoutLogSetRow, "exercise_library_id" | "source_exercise_key">) {
  return log.source_exercise_key ?? log.exercise_library_id ?? "";
}

export async function fetchWorkoutHistory(userId: string, limit = 20): Promise<WorkoutHistoryRow[]> {
  try {
    assertSupabaseConfigured();

    const sessionsRes = await supabase
      .from("workout_sessions")
      .select("id,program_id,day_id,source,source_program_id,source_week_key,source_day_key,started_at,completed_at")
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
      .select("session_id,exercise_library_id,source_exercise_key")
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
    const logs = (allLogsRes.data ?? []) as Pick<WorkoutLogSetRow, "exercise_library_id" | "session_id" | "source_exercise_key">[];
    const logsBySession = new Map<string, { exerciseIds: Set<string>; setCount: number }>();

    sessionIds.forEach((sessionId) => {
      logsBySession.set(sessionId, { exerciseIds: new Set<string>(), setCount: 0 });
    });

    logs.forEach((log) => {
      const bucket = logsBySession.get(log.session_id);
      if (!bucket) return;
      bucket.setCount += 1;
      bucket.exerciseIds.add(getWorkoutLogIdentityKey(log));
    });

    return sessions.map((session) => {
      const bucket = logsBySession.get(session.id) ?? { exerciseIds: new Set<string>(), setCount: 0 };
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

export async function fetchWorkoutSessionDetail(
  userId: string,
  sessionId: string,
): Promise<WorkoutSessionDetail | null> {
  try {
    assertSupabaseConfigured();

    const sessionRes = await supabase
      .from("workout_sessions")
      .select("id,program_id,day_id,source,source_program_id,source_week_key,source_day_key,started_at,completed_at")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .maybeSingle();

    if (sessionRes.error && sessionRes.status !== 406) throw sessionRes.error;

    const session = (sessionRes.data as WorkoutHistorySessionRow | null) ?? null;
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

    const logs = (logsRes.data ?? []) as (
      WorkoutLogSetRow & { id: string; rpe_actual: number | null; set_number: number }
    )[];
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
        : formatFallbackTitle((programRes.data as WorkoutHistoryTitleRow | null)?.title, "Legacy Workout");
    const dayTitle =
      isSignal
        ? formatSignalWorkoutSubtitle(session)
        : formatFallbackTitle((dayRes.data as WorkoutHistoryTitleRow | null)?.title, session.day_id ?? "Day unavailable");

    return {
      completedAt: session.completed_at,
      dayLabel: dayTitle,
      durationMinutes: calculateDurationMinutes(session.started_at, session.completed_at),
      exerciseCount: groupedExercises.size,
      groupedExercises: Array.from(groupedExercises.values()),
      id: session.id,
      programLabel: isSignal ? "Signal Program" : programTitle,
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

export async function fetchProgressOverview(
  userId: string,
  range: ProgressRange = "7d",
): Promise<ProgressOverview> {
  try {
    assertSupabaseConfigured();

    const days = rangeDays(range);
    const todayIso = toIsoDate();
    const startIso = startOfRangeIso(range);
    const startTimestamp = `${startIso}T00:00:00.000Z`;
    const endTimestamp = `${todayIso}T23:59:59.999Z`;

    const [sessionsRes, nutritionRes, targetsRes] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("id,program_id,day_id,started_at,completed_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .gte("completed_at", startTimestamp)
        .lte("completed_at", endTimestamp)
        .order("completed_at", { ascending: false }),
      supabase
        .from("daily_nutrition_summaries")
        .select("date,total_calories,total_protein,total_carbs,total_fat")
        .eq("user_id", userId)
        .gte("date", startIso)
        .lte("date", todayIso)
        .order("date", { ascending: true }),
      supabase
        .from("macro_targets")
        .select("daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target")
        .eq("user_id", userId)
        .order("active_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (sessionsRes.error) throw sessionsRes.error;
    if (nutritionRes.error) throw nutritionRes.error;
    if (targetsRes.error && targetsRes.status !== 406) throw targetsRes.error;

    const sessions = ((sessionsRes.data ?? []) as CompletedWorkoutSessionRow[]).filter((session) =>
      Boolean(session.completed_at),
    );
    const nutritionSummaries = (nutritionRes.data ?? []) as DailyNutritionSummaryRow[];
    const targets = (targetsRes.data as MacroTargetsRow | null) ?? null;
    const sessionIds = sessions.map((session) => session.id);

    const setsRes = sessionIds.length
      ? await supabase
          .from("workout_log_sets")
          .select("session_id,reps_completed,weight_kg,logged_at")
          .in("session_id", sessionIds)
      : { data: [], error: null };

    if (setsRes.error) throw setsRes.error;

    const sets = (setsRes.data ?? []) as WorkoutLogSetRow[];
    const volumeBySession = new Map<string, number>();
    const weeklyVolume = sets.reduce((total, set) => {
      const volume = safeNumber(set.weight_kg) * safeNumber(set.reps_completed);
      volumeBySession.set(set.session_id, (volumeBySession.get(set.session_id) ?? 0) + volume);
      return total + volume;
    }, 0);

    const completedDates = uniqueDateSet(
      sessions.map((session) => session.completed_at).filter((value): value is string => Boolean(value)),
    );
    const weeklyWorkoutCount = sessions.length;
    const consistencyPercent = clampPercent(completedDates.size / days);
    const currentStreak = calculateCurrentStreak(completedDates);

    const proteinTrend = buildTrend(
      nutritionSummaries,
      startIso,
      days,
      "protein",
      targets?.daily_protein_target ?? null,
    );
    const calorieTrend = buildTrend(
      nutritionSummaries,
      startIso,
      days,
      "calories",
      targets?.daily_calorie_target ?? null,
    );

    const nutritionAdherence = {
      calorieAveragePercent: average(calorieTrend.map((point) => point.percentOfTarget)),
      daysWithNutrition: nutritionSummaries.length,
      proteinAveragePercent: average(proteinTrend.map((point) => point.percentOfTarget)),
    };

    const recentSessions = sessions.slice(0, 5).map((session) => ({
      completedAt: session.completed_at ?? "",
      dayId: session.day_id,
      durationMinutes: calculateDurationMinutes(session.started_at, session.completed_at),
      id: session.id,
      programId: session.program_id,
      startedAt: session.started_at,
      volume: volumeBySession.get(session.id) ?? 0,
    }));

    logProgress("info", "Progress overview loaded.", {
      hasNutrition: nutritionSummaries.length > 0,
      hasTargets: Boolean(targets),
      range,
      sessionCount: sessions.length,
      userId,
    });

    return {
      calorieTrend,
      consistencyPercent,
      currentStreak,
      nutritionAdherence,
      proteinTrend,
      range,
      recentSessions,
      weeklyVolume,
      weeklyWorkoutCount,
    };
  } catch (error) {
    logProgress("error", "Failed to fetch progress overview.", {
      error: error instanceof Error ? error.message : String(error),
      range,
      userId,
    });
    throw error;
  }
}

export async function fetchSignalProgramProgress(userId: string): Promise<SignalProgramProgressSnapshot | null> {
  try {
    assertSupabaseConfigured();

    const lifecycleRes = await supabase
      .from("active_programs")
      .select(
        "id,user_id,source,source_program_id,source_program_version,current_week_key,current_day_key,status,started_at,completed_at,replaced_at,updated_at",
      )
      .eq("user_id", userId)
      .eq("source", "signal")
      .in("status", ["active", "completed"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lifecycleRes.error && lifecycleRes.status !== 406) throw lifecycleRes.error;
    const lifecycle = (lifecycleRes.data as SignalProgramLifecycleProgressRow | null) ?? null;
    if (!lifecycle) return null;

    if (__DEV__) {
      console.log("[SignalProgress] lifecycle version", lifecycle.source_program_version);
    }

    let sessionsQuery = supabase
      .from("workout_sessions")
      .select("id,completed_at,source,source_program_id,source_program_version,source_week_key,source_day_key")
      .eq("user_id", userId)
      .eq("source", "signal")
      .eq("source_program_id", lifecycle.source_program_id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    sessionsQuery = lifecycle.source_program_version
      ? sessionsQuery.eq("source_program_version", lifecycle.source_program_version)
      : sessionsQuery.is("source_program_version", null);

    const sessionsRes = await sessionsQuery;

    if (sessionsRes.error) throw sessionsRes.error;

    const completedSessions = (sessionsRes.data ?? []) as SignalCompletedWorkoutSessionRow[];

    if (__DEV__) {
      console.log(
        "[SignalProgress] completed sessions version-filtered",
        completedSessions.map((session) => ({
          id: session.id,
          source_day_key: session.source_day_key,
          source_program_id: session.source_program_id,
          source_program_version: session.source_program_version,
          source_week_key: session.source_week_key,
          status: session.completed_at ? "completed" : "open",
        })),
      );
    }

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
