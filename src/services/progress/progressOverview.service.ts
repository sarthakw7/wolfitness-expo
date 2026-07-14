import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";
import {
  calculateDurationMinutes,
  logProgress,
} from "@/src/services/progress/progress.shared";
import type {
  ProgressOverview,
  ProgressRange,
  ProgressTrendPoint,
} from "@/src/services/progress/progressTypes";

type CompletedWorkoutSessionRow = {
  completed_at: string | null;
  day_id: string | null;
  id: string;
  program_id: string | null;
  started_at: string;
};

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
