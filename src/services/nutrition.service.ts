import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type NutritionLog = {
  barcode_upc: string | null;
  calories: number | null;
  carbs: number | null;
  created_at: string;
  fat: number | null;
  food_name: string;
  id: string;
  logged_at: string;
  meal_category: string | null;
  protein: number | null;
  user_id: string;
};

export type DailyNutritionSummary = {
  date: string;
  id: string;
  total_calories: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  total_protein: number | null;
  user_id: string;
};

export type MacroTargets = {
  active_from: string;
  active_to: string | null;
  created_at: string;
  daily_calorie_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  daily_protein_target: number;
  id: string;
  user_id: string;
};

export type TodayNutrition = {
  date: string;
  logs: NutritionLog[];
  macroTargets: MacroTargets | null;
  summary: DailyNutritionSummary | null;
};

export type AddMealLogInput = {
  barcodeUpc?: string | null;
  calories?: number | null;
  carbs?: number | null;
  fat?: number | null;
  foodName: string;
  loggedAt?: string;
  mealCategory?: string | null;
  protein?: number | null;
  userId: string;
};

export type EstimateMealInput = {
  food: string;
};

export type UpdateMacroTargetsInput = {
  caloriesTarget: number;
  carbsTarget: number;
  fatTarget: number;
  proteinTarget: number;
  userId: string;
};

export type EstimatedMeal = {
  calories: number;
  carbs: number;
  confidence?: number;
  fat: number;
  food_name: string;
  protein: number;
};

export type NutritionCoachInput = {
  message: string;
};

export type NutritionCoachMealRecommendation = {
  estimatedCalories: number | null;
  estimatedCarbs: number | null;
  estimatedFat: number | null;
  estimatedProtein: number | null;
  name: string;
  why: string;
};

export type NutritionCoachResponse = {
  answer: string;
  followUpQuestion: string;
  macroStatus: {
    caloriesRemaining: number | null;
    carbsRemaining: number | null;
    fatRemaining: number | null;
    proteinRemaining: number | null;
    todayCalories: number | null;
    todayCarbs: number | null;
    todayFat: number | null;
    todayProtein: number | null;
  };
  reasoningTags: string[];
  recommendedMeals: NutritionCoachMealRecommendation[];
};

export type NutritionErrorCode =
  | "BAD_REQUEST"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR"
  | "PARSE_ERROR"
  | "PROVIDER_ERROR"
  | "UNAUTHORIZED";

export class NutritionError extends Error {
  code: NutritionErrorCode;

  constructor(message: string, code: NutritionErrorCode = "INTERNAL_ERROR") {
    super(message);
    this.code = code;
    this.name = "NutritionError";
  }
}

function logNutrition(level: "error" | "warn", message: string, context?: Record<string, unknown>) {
  console[level]("[nutrition]", message, context ?? {});
}

function logNutritionAi(level: "error" | "warn" | "info", message: string, context?: Record<string, unknown>) {
  console[level]("[nutrition-ai]", message, context ?? {});
}

function toIsoDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeNutritionError(error: unknown, fallbackMessage: string): NutritionError {
  if (error instanceof NutritionError) return error;
  if (error instanceof Error) return new NutritionError(error.message || fallbackMessage);
  return new NutritionError(fallbackMessage);
}

function getExpoApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
}

export function validateNutritionApiConfiguration() {
  const baseUrl = getExpoApiBaseUrl();

  if (!baseUrl) {
    logNutritionAi(
      "warn",
      "Nutrition API URL is not configured. Set EXPO_PUBLIC_API_URL to your Wolfitness web backend.",
      {
        localExample: "http://192.168.1.16:3000",
        productionExample: "https://wolfitness.vercel.app",
        reason: "Expo devices cannot call localhost on your Mac.",
      },
    );
    return false;
  }

  if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
    logNutritionAi(
      "warn",
      "EXPO_PUBLIC_API_URL points to localhost. Physical devices need your Mac local network IP.",
      {
        configuredUrl: baseUrl,
        localExample: "http://192.168.1.16:3000",
      },
    );
  }

  return true;
}

function resolveNutritionApiUrl(path: string) {
  const baseUrl = getExpoApiBaseUrl();
  if (!baseUrl) {
    throw new NutritionError(
      "Nutrition API URL is not configured. Set EXPO_PUBLIC_API_URL for AI requests.",
      "CONFIGURATION_ERROR",
    );
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function fetchNutritionLogs(userId: string, date = toIsoDate()): Promise<NutritionLog[]> {
  try {
    assertSupabaseConfigured();

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("id,user_id,food_name,meal_category,calories,protein,carbs,fat,barcode_upc,logged_at,created_at")
      .eq("user_id", userId)
      .eq("logged_at", date)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as NutritionLog[]) ?? [];
  } catch (error) {
    logNutrition("error", "Failed to fetch nutrition logs.", { date, userId });
    throw normalizeNutritionError(error, "Unable to fetch nutrition logs.");
  }
}

export async function fetchMacroTargets(userId: string): Promise<MacroTargets | null> {
  try {
    assertSupabaseConfigured();

    const { data, error, status } = await supabase
      .from("macro_targets")
      .select(
        "id,user_id,daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target,active_from,active_to,created_at",
      )
      .eq("user_id", userId)
      .order("active_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && status !== 406) throw error;
    return (data as MacroTargets | null) ?? null;
  } catch (error) {
    logNutrition("error", "Failed to fetch macro targets.", { userId });
    throw normalizeNutritionError(error, "Unable to fetch macro targets.");
  }
}

export async function updateMacroTargets(input: UpdateMacroTargetsInput): Promise<MacroTargets> {
  try {
    assertSupabaseConfigured();

    const latestTarget = await fetchMacroTargets(input.userId);
    const payload = {
      daily_calorie_target: input.caloriesTarget,
      daily_carbs_target: input.carbsTarget,
      daily_fat_target: input.fatTarget,
      daily_protein_target: input.proteinTarget,
    };

    if (latestTarget?.id) {
      const { data, error } = await supabase
        .from("macro_targets")
        .update(payload)
        .eq("id", latestTarget.id)
        .eq("user_id", input.userId)
        .select(
          "id,user_id,daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target,active_from,active_to,created_at",
        )
        .single();

      if (error) throw error;
      return data as MacroTargets;
    }

    const { data, error } = await supabase
      .from("macro_targets")
      .insert({
        ...payload,
        active_from: toIsoDate(),
        active_to: null,
        user_id: input.userId,
      })
      .select(
        "id,user_id,daily_calorie_target,daily_protein_target,daily_carbs_target,daily_fat_target,active_from,active_to,created_at",
      )
      .single();

    if (error) throw error;
    return data as MacroTargets;
  } catch (error) {
    logNutrition("error", "Failed to update macro targets.", {
      caloriesTarget: input.caloriesTarget,
      carbsTarget: input.carbsTarget,
      fatTarget: input.fatTarget,
      proteinTarget: input.proteinTarget,
      userId: input.userId,
    });
    throw normalizeNutritionError(error, "Unable to save nutrition goals.");
  }
}

export async function fetchTodayNutrition(userId: string): Promise<TodayNutrition> {
  const date = toIsoDate();

  try {
    assertSupabaseConfigured();

    const [logs, macroTargets, summaryRes] = await Promise.all([
      fetchNutritionLogs(userId, date),
      fetchMacroTargets(userId),
      supabase
        .from("daily_nutrition_summaries")
        .select("id,user_id,date,total_calories,total_protein,total_carbs,total_fat")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle(),
    ]);

    if (summaryRes.error && summaryRes.status !== 406) throw summaryRes.error;

    return {
      date,
      logs,
      macroTargets,
      summary: (summaryRes.data as DailyNutritionSummary | null) ?? null,
    };
  } catch (error) {
    logNutrition("error", "Failed to fetch today's nutrition state.", { date, userId });
    throw normalizeNutritionError(error, "Unable to fetch today's nutrition.");
  }
}

export async function addMealLog(input: AddMealLogInput): Promise<NutritionLog> {
  try {
    assertSupabaseConfigured();

    const { data, error } = await supabase
      .from("nutrition_logs")
      .insert({
        barcode_upc: input.barcodeUpc ?? null,
        calories: input.calories ?? 0,
        carbs: input.carbs ?? 0,
        fat: input.fat ?? 0,
        food_name: input.foodName,
        logged_at: input.loggedAt ?? toIsoDate(),
        meal_category: input.mealCategory ?? null,
        protein: input.protein ?? 0,
        user_id: input.userId,
      })
      .select("id,user_id,food_name,meal_category,calories,protein,carbs,fat,barcode_upc,logged_at,created_at")
      .single();

    if (error) throw error;
    return data as NutritionLog;
  } catch (error) {
    logNutrition("error", "Failed to add meal log.", {
      foodName: input.foodName,
      loggedAt: input.loggedAt ?? toIsoDate(),
      userId: input.userId,
    });
    throw normalizeNutritionError(error, "Unable to save meal log.");
  }
}

export async function estimateMeal(input: EstimateMealInput): Promise<EstimatedMeal> {
  try {
    assertSupabaseConfigured();

    if (!input.food.trim()) {
      throw new NutritionError("Food description is required.", "BAD_REQUEST");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new NutritionError("You must be signed in to estimate meal macros.", "UNAUTHORIZED");
    }

    const response = await fetch(resolveNutritionApiUrl("/api/ai/nutrition/estimate"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ food: input.food }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (Partial<EstimatedMeal> & { code?: NutritionErrorCode; error?: string })
      | null;

    if (!response.ok) {
      throw new NutritionError(
        payload?.error || "Unable to estimate meal macros.",
        payload?.code || "INTERNAL_ERROR",
      );
    }

    if (
      !payload ||
      typeof payload.food_name !== "string" ||
      typeof payload.calories !== "number" ||
      typeof payload.protein !== "number" ||
      typeof payload.carbs !== "number" ||
      typeof payload.fat !== "number"
    ) {
      throw new NutritionError("Meal estimate response was malformed.", "INTERNAL_ERROR");
    }

    return {
      calories: payload.calories,
      carbs: payload.carbs,
      confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
      fat: payload.fat,
      food_name: payload.food_name,
      protein: payload.protein,
    };
  } catch (error) {
    logNutrition("warn", "Meal estimate failed.", {
      food: input.food,
      message: error instanceof Error ? error.message : String(error),
    });
    throw normalizeNutritionError(error, "Unable to estimate meal macros.");
  }
}

export async function askNutritionCoach(input: NutritionCoachInput): Promise<NutritionCoachResponse> {
  try {
    assertSupabaseConfigured();

    if (!input.message.trim()) {
      throw new NutritionError("A coaching question is required.", "BAD_REQUEST");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new NutritionError("You must be signed in to use Wolf AI Coach.", "UNAUTHORIZED");
    }

    const response = await fetch(resolveNutritionApiUrl("/api/ai/nutrition/coach"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input.message }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (Partial<NutritionCoachResponse> & { code?: NutritionErrorCode; error?: string })
      | null;

    if (!response.ok) {
      throw new NutritionError(
        payload?.error || "Unable to get nutrition coaching right now.",
        payload?.code || "INTERNAL_ERROR",
      );
    }

    if (
      !payload ||
      typeof payload.answer !== "string" ||
      typeof payload.followUpQuestion !== "string" ||
      !Array.isArray(payload.recommendedMeals) ||
      !Array.isArray(payload.reasoningTags) ||
      typeof payload.macroStatus !== "object" ||
      payload.macroStatus === null
    ) {
      throw new NutritionError("Nutrition coach response was malformed.", "PARSE_ERROR");
    }

    return {
      answer: payload.answer,
      followUpQuestion: payload.followUpQuestion,
      macroStatus: {
        caloriesRemaining:
          typeof payload.macroStatus.caloriesRemaining === "number" ? payload.macroStatus.caloriesRemaining : null,
        carbsRemaining: typeof payload.macroStatus.carbsRemaining === "number" ? payload.macroStatus.carbsRemaining : null,
        fatRemaining: typeof payload.macroStatus.fatRemaining === "number" ? payload.macroStatus.fatRemaining : null,
        proteinRemaining:
          typeof payload.macroStatus.proteinRemaining === "number" ? payload.macroStatus.proteinRemaining : null,
        todayCalories: typeof payload.macroStatus.todayCalories === "number" ? payload.macroStatus.todayCalories : null,
        todayCarbs: typeof payload.macroStatus.todayCarbs === "number" ? payload.macroStatus.todayCarbs : null,
        todayFat: typeof payload.macroStatus.todayFat === "number" ? payload.macroStatus.todayFat : null,
        todayProtein: typeof payload.macroStatus.todayProtein === "number" ? payload.macroStatus.todayProtein : null,
      },
      reasoningTags: payload.reasoningTags.filter((tag): tag is string => typeof tag === "string"),
      recommendedMeals: payload.recommendedMeals
        .filter((meal): meal is NutritionCoachMealRecommendation => {
          return (
            typeof meal === "object" &&
            meal !== null &&
            typeof meal.name === "string" &&
            typeof meal.why === "string"
          );
        })
        .map((meal) => ({
          estimatedCalories: typeof meal.estimatedCalories === "number" ? meal.estimatedCalories : null,
          estimatedCarbs: typeof meal.estimatedCarbs === "number" ? meal.estimatedCarbs : null,
          estimatedFat: typeof meal.estimatedFat === "number" ? meal.estimatedFat : null,
          estimatedProtein: typeof meal.estimatedProtein === "number" ? meal.estimatedProtein : null,
          name: meal.name,
          why: meal.why,
        })),
    };
  } catch (error) {
    console.warn("[nutrition-ai]", "Wolf AI Coach request failed.", {
      message: error instanceof Error ? error.message : String(error),
    });
    throw normalizeNutritionError(error, "Unable to get nutrition coaching right now.");
  }
}
