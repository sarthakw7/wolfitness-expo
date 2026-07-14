import { useMemo } from "react";

import type { ProgramCardModel } from "@/src/components/marketplace/types";
import {
  dayKey,
  estimateSessionMinutes,
  percent,
  prettyGoal,
  titleCase,
} from "@/src/features/dashboard/lib/dashboardFormatters";

type EnrollmentLike = {
  program_id: string;
  status: string;
};

type ProgramLike = {
  coach_name: string | null;
  description: string | null;
  difficulty: string | null;
  duration_weeks: number | null;
  id: string;
  image_url: string | null;
  price: number;
  title: string;
};

type NutritionLike = {
  macroTargets: {
    daily_calorie_target: number;
    daily_protein_target: number;
  } | null;
  todayNutritionSummary: {
    total_calories: number | null;
    total_protein: number | null;
  } | null;
  weeklyCompletedSessionDates: string[];
} | null | undefined;

type WorkoutPlanLike = {
  day: {
    title: string | null;
  };
  exercises: unknown[];
  program: {
    difficulty?: string | null;
    title: string;
  };
} | null | undefined;

type SignalTodayStateLike = {
  currentDayLabel: string;
  currentWeekLabel: string;
  programTitle: string;
} | null;

type UseAthleteDashboardDerivedStateInput = {
  enrollments: EnrollmentLike[] | null | undefined;
  nutrition: NutritionLike;
  profilePrimaryGoal: string | null | undefined;
  programs: ProgramLike[] | null | undefined;
  signalLifecycleStatus: string | null | undefined;
  signalTodayState: SignalTodayStateLike;
  workoutPlan: WorkoutPlanLike;
  workoutSessionStatus: unknown;
};

export function useAthleteDashboardDerivedState({
  enrollments,
  nutrition,
  profilePrimaryGoal,
  programs,
  signalLifecycleStatus,
  signalTodayState,
  workoutPlan,
  workoutSessionStatus,
}: UseAthleteDashboardDerivedStateInput) {
  const programMap = useMemo(() => {
    const map = new Map<string, ProgramLike>();
    (programs ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [programs]);

  const activeEnrollment = useMemo(() => {
    const list = enrollments ?? [];
    return list.find((e) => e.status === "active") ?? null;
  }, [enrollments]);

  const hasAnyEnrollment = (enrollments ?? []).length > 0;

  const legacyActiveProgram = useMemo(() => {
    if (!activeEnrollment) return null;
    return programMap.get(activeEnrollment.program_id) ?? null;
  }, [activeEnrollment, programMap]);

  const featuredPrograms = useMemo<ProgramCardModel[]>(() => {
    return (programs ?? []).slice(0, 3).map((program) => ({
      category: program.difficulty ? titleCase(program.difficulty) : "Program",
      coach: program.coach_name ?? "Wolfitness Coach",
      description: program.description ?? "Structured performance protocol.",
      duration: program.duration_weeks ? `${program.duration_weeks} Weeks` : "Flexible",
      id: program.id,
      image:
        program.image_url ??
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      level: program.difficulty ? titleCase(program.difficulty) : "All Levels",
      price: `$${program.price}`,
      title: program.title,
    }));
  }, [programs]);

  const sessionMinutes = estimateSessionMinutes(workoutPlan?.exercises.length ?? 0);
  const headlineTitle = prettyGoal(profilePrimaryGoal);
  const hasNutritionData = Boolean(nutrition?.todayNutritionSummary || nutrition?.macroTargets);
  const todaySessionTitle =
    signalTodayState?.programTitle ??
    workoutPlan?.program.title ??
    legacyActiveProgram?.title ??
    "No Active Program";
  const todayFocus =
    signalTodayState
      ? `${signalTodayState.currentWeekLabel} · ${signalTodayState.currentDayLabel}`
      : workoutPlan?.day.title ?? "Start with today’s assigned session";
  const todayLoad = signalTodayState
    ? "Active Signal Program"
    : legacyActiveProgram?.difficulty
      ? titleCase(legacyActiveProgram.difficulty)
      : "Moderate";

  const macroProgress = useMemo(() => {
    const summary = nutrition?.todayNutritionSummary;
    const targets = nutrition?.macroTargets;
    if (!summary || !targets) {
      return {
        calories: { progress: 0, trend: "No nutrition data yet", value: "--" },
        protein: { progress: 0, trend: "Set macro targets to calibrate", value: "--" },
      };
    }

    const caloriesProgress = percent(summary.total_calories ?? 0, targets.daily_calorie_target);
    const proteinProgress = percent(summary.total_protein ?? 0, targets.daily_protein_target);
    return {
      calories: {
        progress: caloriesProgress,
        trend: `Daily Goal ${targets.daily_calorie_target.toLocaleString()} kcal`,
        value: Math.round(summary.total_calories ?? 0).toLocaleString(),
      },
      protein: {
        progress: proteinProgress,
        trend: `Target ${Math.round(targets.daily_protein_target)} g`,
        value: `${Math.round(summary.total_protein ?? 0)} / ${Math.round(targets.daily_protein_target)}g`,
      },
    };
  }, [nutrition?.macroTargets, nutrition?.todayNutritionSummary]);

  const workoutCta = useMemo(() => {
    if (signalTodayState && signalLifecycleStatus === "active") {
      return {
        href: "/(tabs)/workouts" as const,
        icon: "play-circle-outline" as const,
        label: "Go to Workout",
      };
    }
    if (!legacyActiveProgram) {
      return {
        href: "/(marketplace)" as const,
        icon: "compass-outline" as const,
        label: "Explore Programs",
      };
    }
    if (workoutSessionStatus) {
      return {
        href: "/(tabs)/workouts" as const,
        icon: "play-circle-outline" as const,
        label: "Resume Workout",
      };
    }
    return {
      href: "/(tabs)/workouts" as const,
      icon: "barbell-outline" as const,
      label: "Start Today's Workout",
    };
  }, [legacyActiveProgram, signalLifecycleStatus, signalTodayState, workoutSessionStatus]);

  const weeklyDots = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const labels = ["M", "T", "W", "T", "F", "S", "S"];

    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const completed = (nutrition?.weeklyCompletedSessionDates ?? []).some((iso) => dayKey(iso) === key);
      const isFuture = d.getTime() > now.getTime();
      const isToday = dayKey(d.toISOString()) === dayKey(new Date().toISOString());
      return { completed, isFuture, isToday, label };
    });
  }, [nutrition?.weeklyCompletedSessionDates]);

  return {
    activeEnrollment,
    featuredPrograms,
    hasAnyEnrollment,
    hasNutritionData,
    headlineTitle,
    legacyActiveProgram,
    macroProgress,
    programMap,
    sessionMinutes,
    todayFocus,
    todayLoad,
    todaySessionTitle,
    weeklyDots,
    workoutCta,
  };
}
