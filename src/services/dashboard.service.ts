import { supabase } from "@/src/lib/supabase";

export type MacroTargets = {
  active_from: string;
  active_to: string | null;
  daily_calorie_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  daily_protein_target: number;
  id: string;
  user_id: string;
};

export type DailyNutritionSummary = {
  date: string;
  id: string;
  total_calories: number;
  total_carbs: number;
  total_fat: number;
  total_protein: number;
  user_id: string;
};

export type DashboardOverview = {
  macroTargets: MacroTargets | null;
  todayNutritionSummary: DailyNutritionSummary | null;
};

export async function fetchDashboardOverview(userId: string, todayIso: string): Promise<DashboardOverview> {
  const [targetsRes, summaryRes] = await Promise.all([
    supabase
      .from("macro_targets")
      .select("id,user_id,daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target,active_from,active_to")
      .eq("user_id", userId)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("daily_nutrition_summaries")
      .select("id,user_id,date,total_calories,total_protein,total_carbs,total_fat")
      .eq("user_id", userId)
      .eq("date", todayIso)
      .maybeSingle(),
  ]);

  if (targetsRes.error && targetsRes.status !== 406) throw targetsRes.error;
  if (summaryRes.error && summaryRes.status !== 406) throw summaryRes.error;

  return {
    macroTargets: (targetsRes.data as MacroTargets | null) ?? null,
    todayNutritionSummary: (summaryRes.data as DailyNutritionSummary | null) ?? null,
  };
}

