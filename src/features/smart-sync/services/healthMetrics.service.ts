import { supabase } from "@/src/lib/supabase";

import { getLocalDateKey } from "../lib/health-metrics";
import type { HealthMetricSummaryFields } from "../types";

export type HealthMetricLogRow = HealthMetricSummaryFields & {
  created_at: string;
  id: string;
  log_date: string;
  notes: string | null;
  source: string;
  updated_at: string;
  user_id: string;
};

export type UpsertTodayHealthMetricLogInput = HealthMetricSummaryFields;

function toHealthMetricRow(row: HealthMetricLogRow | null): HealthMetricSummaryFields | null {
  if (!row) return null;
  return {
    bodyWeightKg: row.bodyWeightKg,
    caloriesBurned: row.caloriesBurned,
    notes: row.notes,
    restingHeartRate: row.restingHeartRate,
    sleepHours: row.sleepHours,
    steps: row.steps,
  };
}

export async function getTodayHealthMetricLog(userId: string): Promise<HealthMetricSummaryFields | null> {
  const logDate = getLocalDateKey();
  const { data, error } = await supabase
    .from("health_metric_logs")
    .select("id,user_id,log_date,steps,sleep_hours,resting_heart_rate,calories_burned,body_weight_kg,notes,source,created_at,updated_at")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .eq("source", "manual")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return toHealthMetricRow({
    bodyWeightKg: data.body_weight_kg ?? null,
    caloriesBurned: data.calories_burned ?? null,
    created_at: data.created_at,
    id: data.id,
    log_date: data.log_date,
    notes: data.notes ?? null,
    restingHeartRate: data.resting_heart_rate ?? null,
    sleepHours: data.sleep_hours ?? null,
    source: data.source,
    steps: data.steps ?? null,
    updated_at: data.updated_at,
    user_id: data.user_id,
  });
}

export async function upsertTodayHealthMetricLog(userId: string, payload: UpsertTodayHealthMetricLogInput): Promise<void> {
  const logDate = getLocalDateKey();
  const { error } = await supabase.from("health_metric_logs").upsert(
    {
      body_weight_kg: payload.bodyWeightKg,
      calories_burned: payload.caloriesBurned,
      log_date: logDate,
      notes: payload.notes,
      resting_heart_rate: payload.restingHeartRate,
      source: "manual",
      steps: payload.steps,
      user_id: userId,
    },
    { onConflict: "user_id,log_date,source" },
  );

  if (error) throw error;
}
