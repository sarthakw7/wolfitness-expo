import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, useMemo } from "react";
import { ImageBackground, View } from "react-native";

import {
  AppButton,
  GlassCard,
  Typography,
} from "@/src/components/primitives";
import {
  AppTopBar,
  Chip,
  EditorialCard,
  ScreenScaffold,
  SectionTitle,
  StatCard,
} from "@/src/components/layout";
import { MarketplaceRail, ProgramCard } from "@/src/components/marketplace";
import { useDashboard, useEnrollments, useProfile, usePrograms } from "@/src/hooks/queries";
import type { Program } from "@/src/services/programs.service";
import { colors } from "@/src/theme";
import type { MarketplaceProgram } from "@/src/constants/marketplace";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Lt7B2pUHplBybkn77mauDPD2uknpPW3rz2oPP-1P15sQRnQvEGqUrIdVsdqLWAFEJVUL8zT_RpiKhx6kcefATW7OQddv8jMkxL2nOCh58Bchxc3-waMAp_9tCOLZXBEYxgCog2SHQ0e1X8Sxl2fSAV4JWzu7xNG9DetNYrOtRpam2-8m4Nl7zczbI_uboD2SrpHBMcO2xWB5k-K2E5qAEy3nQzXy-9hJT1jmv1STgrgro3chu6Q6ADmU6w6k943_wALFo7uVVbXX";

function dayKey(dateIso: string) {
  return dateIso.slice(0, 10);
}

function percent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, value / total));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

function DashboardSkeleton() {
  return (
    <View className="gap-gutter">
      <EditorialCard className="min-h-56 bg-surface-muted" />
      <EditorialCard className="min-h-32 bg-surface-muted" />
      <EditorialCard className="min-h-40 bg-surface-muted" />
    </View>
  );
}

function AthleteDashboardScreenComponent() {
  const profileQuery = useProfile();
  const enrollmentsQuery = useEnrollments();
  const dashboardQuery = useDashboard();
  const programsQuery = usePrograms({ publishedOnly: true });

  const hasBlockingError = profileQuery.error || enrollmentsQuery.error || dashboardQuery.error || programsQuery.error;

  const programMap = useMemo(() => {
    const map = new Map<string, Program>();
    (programsQuery.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [programsQuery.data]);

  const activeEnrollment = useMemo(() => {
    const list = enrollmentsQuery.data ?? [];
    return list.find((e) => e.status === "active") ?? null;
  }, [enrollmentsQuery.data]);

  const activeProgram = useMemo(() => {
    if (!activeEnrollment) return null;
    return programMap.get(activeEnrollment.program_id) ?? null;
  }, [activeEnrollment, programMap]);

  const featuredPrograms = useMemo<MarketplaceProgram[]>(() => {
    return (programsQuery.data ?? []).slice(0, 3).map((program) => ({
      category: program.difficulty ? titleCase(program.difficulty) : "Program",
      coach: "Wolfitness Coach",
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
  }, [programsQuery.data]);

  const profileName = useMemo(() => {
    const fromPublic = profileQuery.data?.publicProfile?.full_name;
    const fromEmail = profileQuery.data?.publicProfile?.email ?? null;
    if (fromPublic) return fromPublic;
    if (fromEmail) return fromEmail.split("@")[0];
    return "Athlete";
  }, [profileQuery.data?.publicProfile?.email, profileQuery.data?.publicProfile?.full_name]);

  const primaryGoalLabel = useMemo(() => {
    const raw = profileQuery.data?.fitnessProfile?.primary_goal ?? null;
    return raw ? titleCase(raw) : "Stay Consistent";
  }, [profileQuery.data?.fitnessProfile?.primary_goal]);

  const nutrition = dashboardQuery.data;

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

  const weekly = useMemo(() => {
    const weeklyDates = nutrition?.weeklyCompletedSessionDates ?? [];
    const uniqueWeekDays = new Set(weeklyDates.map(dayKey));
    const completedDays = uniqueWeekDays.size;
    const weeklyPercent = Math.round((completedDays / 7) * 100);

    const recent = nutrition?.recentCompletedSessionDates ?? [];
    const daySet = new Set(recent.map(dayKey));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 120; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (daySet.has(key)) {
        streak += 1;
      } else if (i > 0 || !daySet.has(key)) {
        break;
      }
    }

    const bars = (() => {
      const out: Array<{ day: string; value: number }> = [];
      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const labels = ["M", "T", "W", "T", "F", "S", "S"];
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        out.push({ day: labels[i], value: daySet.has(key) ? 1 : 0.14 });
      }
      return out;
    })();

    return { bars, streak, weeklyPercent };
  }, [nutrition?.recentCompletedSessionDates, nutrition?.weeklyCompletedSessionDates]);

  const isLoading =
    profileQuery.isLoading || enrollmentsQuery.isLoading || dashboardQuery.isLoading || programsQuery.isLoading;

  return (
    <ScreenScaffold header={<AppTopBar />}>
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          {greeting()}, {profileName}
        </Typography>
        <Typography variant="displayLg">{primaryGoalLabel}</Typography>
      </View>

      {hasBlockingError ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Unable to load dashboard</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please pull to refresh or try again in a moment.
          </Typography>
        </EditorialCard>
      ) : null}

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && !hasBlockingError ? (
      <View className="gap-gutter">
        <View className="min-h-[420px] overflow-hidden rounded-3xl bg-surface-muted">
          <ImageBackground
            accessibilityLabel="Daily workout editorial image"
            source={{ uri: heroImage }}
            style={{ flex: 1, justifyContent: "flex-end", padding: 12 }}
          >
            <GlassCard className="gap-4" intensity={18}>
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Typography tone="secondary" variant="labelSm">
                    {activeProgram ? "Current Program" : "Today’s Focus"}
                  </Typography>
                  <Typography variant="headlineXl">
                    {activeProgram?.title ?? "Complete onboarding calibration"}
                  </Typography>
                </View>
                <Chip label={activeProgram?.duration_weeks ? `${activeProgram.duration_weeks} Weeks` : "No Active Block"} />
              </View>
              <View className="flex-row gap-8">
                <View>
                  <Typography tone="secondary" variant="labelSm">
                    Focus
                  </Typography>
                  <Typography variant="bodyMd">{activeProgram?.vibe_type ? titleCase(activeProgram.vibe_type) : primaryGoalLabel}</Typography>
                </View>
                <View>
                  <Typography tone="secondary" variant="labelSm">
                    Status
                  </Typography>
                  <Typography variant="bodyMd">{activeEnrollment ? titleCase(activeEnrollment.status) : "Not Enrolled"}</Typography>
                </View>
              </View>
              {activeProgram ? (
                <Link
                  asChild
                  href={{
                    pathname: "/(marketplace)/program/[programId]",
                    params: { programId: activeProgram.id },
                  }}
                >
                  <AppButton iconLeft={<Ionicons color={colors.white} name="arrow-forward" size={16} />}>
                    Continue Program
                  </AppButton>
                </Link>
              ) : (
                <Link href="/(marketplace)" asChild>
                  <AppButton iconLeft={<Ionicons color={colors.white} name="compass-outline" size={16} />}>
                    Explore Programs
                  </AppButton>
                </Link>
              )}
            </GlassCard>
          </ImageBackground>
        </View>

        <View className="gap-gutter">
          <StatCard
            icon="flame-outline"
            label="Nutrition Energy"
            progress={macroProgress.calories.progress}
            trend={macroProgress.calories.trend}
            unit="kcal"
            value={macroProgress.calories.value}
          />
          <StatCard
            icon="nutrition-outline"
            label="Protein Progress"
            progress={macroProgress.protein.progress}
            trend={macroProgress.protein.trend}
            value={macroProgress.protein.value}
          />
          <EditorialCard className="gap-6">
            <SectionTitle title={`Weekly Consistency ${weekly.weeklyPercent}%`} />
            <View className="flex-row items-end justify-between">
              {weekly.bars.map((bar, index) => (
                <View className="items-center gap-2" key={index}>
                  <View className="h-14 w-8 justify-end rounded-full bg-surface-muted p-1">
                    <View
                      className="w-full rounded-full bg-emerald"
                      style={{ height: `${bar.value * 100}%` }}
                    />
                  </View>
                  <Typography tone="secondary" variant="labelSm">
                    {bar.day}
                  </Typography>
                </View>
              ))}
            </View>
            <Typography tone="secondary" variant="labelSm">
              Current streak: {weekly.streak} day{weekly.streak === 1 ? "" : "s"}
            </Typography>
          </EditorialCard>
        </View>
      </View>
      ) : null}

      <View className="gap-section">
        <MarketplaceRail
          action={
            <Link href="/(marketplace)" asChild>
              <AppButton size="sm" variant="ghost">Explore</AppButton>
            </Link>
          }
          subtitle="Coach-led blocks selected for your current training rhythm."
          title="Featured Programs"
        >
          {featuredPrograms.length === 0 ? (
            <EditorialCard className="w-72 items-center justify-center p-5">
              <Typography tone="secondary" variant="bodyMd">
                No published programs yet.
              </Typography>
            </EditorialCard>
          ) : null}
          {featuredPrograms.map((program) => (
            <ProgramCard compact key={program.id} program={program} />
          ))}
        </MarketplaceRail>
      </View>
    </ScreenScaffold>
  );
}

export const AthleteDashboardScreen = memo(AthleteDashboardScreenComponent);
