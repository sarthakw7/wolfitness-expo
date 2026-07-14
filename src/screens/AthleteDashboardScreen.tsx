import { Link, router } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { View } from "react-native";

import {
  AppButton,
  Typography,
} from "@/src/components/primitives";
import {
  AppTopBar,
  EditorialCard,
  ScreenScaffold,
} from "@/src/components/layout";
import type { ProgramCardModel } from "@/src/components/marketplace/types";
import { ActiveWorkoutBanner } from "@/src/features/dashboard/components/ActiveWorkoutBanner";
import { DashboardMetricCards } from "@/src/features/dashboard/components/DashboardMetricCards";
import { FeaturedProgramsCarousel } from "@/src/features/dashboard/components/FeaturedProgramsCarousel";
import { TodaySessionHero } from "@/src/features/dashboard/components/TodaySessionHero";
import { useAuth } from "@/src/hooks/useAuth";
import { useActiveProgram } from "@/src/hooks/queries/useActiveProgram";
import {
  useDashboard,
  useEnrollments,
  useProfile,
  usePrograms,
  useSignalProgramProgress,
  useWorkoutActiveSession,
  useWorkout,
  useWorkoutSessionStatus,
} from "@/src/hooks/queries";
import { useWorkoutProgram } from "@/src/hooks/useWorkoutProgram";
import {
  dayKey,
  estimateSessionMinutes,
  formatActiveSignalWorkoutTitle,
  formatStartedAgo,
  percent,
  prettyGoal,
  titleCase,
} from "@/src/features/dashboard/lib/dashboardFormatters";
import { SignalProgramDashboardCard } from "@/src/features/signal-programs/components/SignalProgramDashboardCard";
import { WolfAIDashboardSection } from "@/src/features/wolf-ai/components/WolfAIDashboardSection";
import type { Program } from "@/src/services/programs.service";
import { getSignalProgramProgress } from "@/src/services/signal-workout-adapter";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Lt7B2pUHplBybkn77mauDPD2uknpPW3rz2oPP-1P15sQRnQvEGqUrIdVsdqLWAFEJVUL8zT_RpiKhx6kcefATW7OQddv8jMkxL2nOCh58Bchxc3-waMAp_9tCOLZXBEYxgCog2SHQ0e1X8Sxl2fSAV4JWzu7xNG9DetNYrOtRpam2-8m4Nl7zczbI_uboD2SrpHBMcO2xWB5k-K2E5qAEy3nQzXy-9hJT1jmv1STgrgro3chu6Q6ADmU6w6k943_wALFo7uVVbXX";

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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const profileQuery = useProfile();
  const enrollmentsQuery = useEnrollments();
  const dashboardQuery = useDashboard();
  const programsQuery = usePrograms({ publishedOnly: true });
  const workoutQuery = useWorkout();
  const workoutSessionStatusQuery = useWorkoutSessionStatus(workoutQuery.data ?? null);
  const activeProgramQuery = useActiveProgram(userId ?? undefined);
  const signalProgramProgressQuery = useSignalProgramProgress(
    userId ?? undefined,
    activeProgramQuery.data?.source_program_version ?? null,
  );
  const signalLifecycleRow = signalProgramProgressQuery.data?.lifecycle ?? null;
  const signalProgramVersionId = signalLifecycleRow?.source_program_version ?? null;
  const signalSessionScope = useMemo(() => {
    const activeSignalProgram = activeProgramQuery.data ?? null;
    if (
      !activeSignalProgram ||
      activeSignalProgram.source !== "signal" ||
      activeSignalProgram.status !== "active" ||
      !activeSignalProgram.current_week_key ||
      !activeSignalProgram.current_day_key
    ) {
      return null;
    }

    return {
      activeProgramId: activeSignalProgram.id,
      sourceDayKey: activeSignalProgram.current_day_key,
      sourceProgramId: activeSignalProgram.source_program_id,
      sourceProgramVersion: activeSignalProgram.source_program_version ?? null,
      sourceWeekKey: activeSignalProgram.current_week_key,
    };
  }, [activeProgramQuery.data]);
  const activeWorkoutSessionQuery = useWorkoutActiveSession(signalSessionScope);
  const signalProgramQuery = useWorkoutProgram(signalLifecycleRow?.source_program_id, signalProgramVersionId);
  const activeWorkoutSession = activeWorkoutSessionQuery.data ?? null;
  const hasOpenSignalWorkoutSession = useMemo(() => {
    const session = activeWorkoutSession;
    if (!session || !signalLifecycleRow || signalLifecycleRow.status !== "active") return false;

    return Boolean(
      session.source === "signal" &&
        session.completed_at === null &&
        session.cancelled_at === null &&
        session.source_program_id === signalLifecycleRow.source_program_id &&
        session.source_week_key === signalLifecycleRow.current_week_key &&
        session.source_day_key === signalLifecycleRow.current_day_key,
    );
  }, [activeWorkoutSession, signalLifecycleRow]);

  const hasBlockingError =
    profileQuery.error ||
    enrollmentsQuery.error ||
    dashboardQuery.error ||
    programsQuery.error ||
    workoutQuery.error ||
    workoutSessionStatusQuery.error;

  useEffect(() => {
    const failures = [
      ["profile", profileQuery.error],
      ["enrollments", enrollmentsQuery.error],
      ["dashboard", dashboardQuery.error],
      ["programs", programsQuery.error],
      ["workout", workoutQuery.error],
      ["workout-session-status", workoutSessionStatusQuery.error],
      ["signal-program-progress", signalProgramProgressQuery.error],
      ["signal-workout-program", signalProgramQuery.error],
      ["active-workout-session", activeWorkoutSessionQuery.error],
    ].filter(([, error]) => Boolean(error));

    failures.forEach(([type, error]) => {
      console.warn("[athlete-flow]", {
        error: error instanceof Error ? error.message : String(error),
        screen: "AthleteDashboard",
        type,
      });
    });
  }, [
    dashboardQuery.error,
    enrollmentsQuery.error,
    profileQuery.error,
    programsQuery.error,
    workoutQuery.error,
    workoutSessionStatusQuery.error,
    signalProgramProgressQuery.error,
    signalProgramQuery.error,
    activeWorkoutSessionQuery.error,
  ]);

  const programMap = useMemo(() => {
    const map = new Map<string, Program>();
    (programsQuery.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [programsQuery.data]);

  const activeEnrollment = useMemo(() => {
    const list = enrollmentsQuery.data ?? [];
    return list.find((e) => e.status === "active") ?? null;
  }, [enrollmentsQuery.data]);

  const hasAnyEnrollment = (enrollmentsQuery.data ?? []).length > 0;

  const legacyActiveProgram = useMemo(() => {
    if (!activeEnrollment) return null;
    return programMap.get(activeEnrollment.program_id) ?? null;
  }, [activeEnrollment, programMap]);

  const featuredPrograms = useMemo<ProgramCardModel[]>(() => {
    return (programsQuery.data ?? []).slice(0, 3).map((program) => ({
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
  }, [programsQuery.data]);

  const nutrition = dashboardQuery.data;
  const workoutPlan = workoutQuery.data;
  const sessionMinutes = estimateSessionMinutes(workoutPlan?.exercises.length ?? 0);
  const headlineTitle = prettyGoal(profileQuery.data?.fitnessProfile?.primary_goal);
  const hasNutritionData = Boolean(nutrition?.todayNutritionSummary || nutrition?.macroTargets);
  const signalProgressState = useMemo(() => {
    if (activeProgramQuery.isLoading || signalProgramProgressQuery.isLoading || signalProgramQuery.isLoading) {
      return { kind: "loading" as const };
    }

    if (signalProgramProgressQuery.error || signalProgramQuery.error) {
      return {
        body: "We could not load the progress for your Signal program.",
        ctaLabel: "Browse Programs",
        kind: "program_unavailable" as const,
        title: "Program unavailable",
      };
    }

    return getSignalProgramProgress(
      signalProgramQuery.data,
      signalProgramProgressQuery.data?.completedSessions ?? [],
      signalLifecycleRow,
    );
  }, [
    activeProgramQuery.isLoading,
    signalLifecycleRow,
    signalProgramProgressQuery.data,
    signalProgramProgressQuery.error,
    signalProgramProgressQuery.isLoading,
    signalProgramQuery.data,
    signalProgramQuery.error,
    signalProgramQuery.isLoading,
  ]);
  const signalReadyState = signalProgressState.kind === "ready" ? signalProgressState : null;
  const todaySessionTitle =
    signalReadyState?.programTitle ??
    workoutPlan?.program.title ??
    legacyActiveProgram?.title ??
    "No Active Program";
  const todayFocus =
    signalReadyState && signalLifecycleRow
      ? `${signalReadyState.currentWeekLabel} · ${signalReadyState.currentDayLabel}`
      : workoutPlan?.day.title ?? "Start with today’s assigned session";
  const todayLoad = signalReadyState
    ? "Active Signal Program"
    : legacyActiveProgram?.difficulty
      ? titleCase(legacyActiveProgram.difficulty)
      : "Moderate";
  const signalCardState = useMemo(() => {
    if (signalProgressState.kind === "hidden") return { kind: "hidden" as const };
    if (signalProgressState.kind === "loading") return { kind: "loading" as const };
    if (signalProgressState.kind === "program_unavailable" || signalProgressState.kind === "active_pointer_invalid") {
      return signalProgressState;
    }
    if (!signalReadyState) return { kind: "loading" as const };

    return {
      completedWorkouts: signalReadyState.completedWorkouts,
      currentDayLabel: signalReadyState.currentDayLabel,
      currentWeekLabel: signalReadyState.currentWeekLabel,
      hasOpenSession: hasOpenSignalWorkoutSession,
      isProgramCompleted: signalReadyState.isProgramCompleted,
      kind: "ready" as const,
      nextWorkoutPreview: signalReadyState.nextWorkoutPreview,
      percentage: signalReadyState.percentage,
      programTitle: signalReadyState.programTitle,
      totalWorkouts: signalReadyState.totalWorkouts,
    };
  }, [hasOpenSignalWorkoutSession, signalProgressState, signalReadyState]);
  const activeWorkoutBannerState = useMemo(() => {
    if (activeWorkoutSessionQuery.isLoading) {
      return { kind: "loading" as const };
    }

    if (activeWorkoutSessionQuery.error) {
      return { kind: "error" as const };
    }

    if (!activeWorkoutSession || activeWorkoutSession.completed_at) {
      return { kind: "hidden" as const };
    }

    if (activeWorkoutSession.source === "signal") {
      if (
        !activeWorkoutSession.source_program_id ||
        !activeWorkoutSession.source_week_key ||
        !activeWorkoutSession.source_day_key
      ) {
        return {
          body: "This Signal workout is missing required week or day keys.",
          ctaLabel: activeWorkoutSession.source_program_id ? "View Program" : null,
          kind: "recovery" as const,
          programId: activeWorkoutSession.source_program_id,
          title: "Workout needs recovery",
        };
      }

      const activePointerMatches =
        signalLifecycleRow?.status === "active" &&
        signalLifecycleRow.source_program_id === activeWorkoutSession.source_program_id &&
        signalLifecycleRow.current_week_key === activeWorkoutSession.source_week_key &&
        signalLifecycleRow.current_day_key === activeWorkoutSession.source_day_key;

      if (!activePointerMatches) {
        return {
          body: "Your active Signal program no longer points to this unfinished workout.",
          ctaLabel: "View Program",
          kind: "recovery" as const,
          programId: activeWorkoutSession.source_program_id,
          title: "Workout needs recovery",
        };
      }

      return {
        body:
          formatStartedAgo(activeWorkoutSession.started_at) ??
          "Resume your unfinished Signal workout.",
        kind: "ready" as const,
        label: "Signal",
        resumeParams: {
          signalDayId: activeWorkoutSession.source_day_key,
          signalProgramId: activeWorkoutSession.source_program_id,
          signalWeekId: activeWorkoutSession.source_week_key,
        },
        subtitle: formatActiveSignalWorkoutTitle(
          signalProgramQuery.data?.program.title ?? signalReadyState?.programTitle ?? null,
          signalProgramQuery.data?.weeks ?? null,
          activeWorkoutSession.source_week_key,
          activeWorkoutSession.source_day_key,
        ),
        title: "Workout in Progress",
      };
    }

    return {
      body:
        formatStartedAgo(activeWorkoutSession.started_at) ??
        "Resume your unfinished workout.",
      kind: "ready" as const,
      label: "Legacy",
      resumeParams: null,
      subtitle:
        workoutPlan?.program.title && workoutPlan?.day.title
          ? `${workoutPlan.program.title} · ${workoutPlan.day.title}`
          : "Workout in progress",
      title: "Workout in Progress",
    };
  }, [
    activeWorkoutSession,
    activeWorkoutSessionQuery.error,
    activeWorkoutSessionQuery.isLoading,
    signalLifecycleRow,
    signalProgramQuery.data?.program.title,
    signalProgramQuery.data?.weeks,
    signalReadyState?.programTitle,
    workoutPlan?.day.title,
    workoutPlan?.program.title,
  ]);

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

  const isLoading =
    profileQuery.isLoading ||
    enrollmentsQuery.isLoading ||
    dashboardQuery.isLoading ||
    programsQuery.isLoading ||
    workoutQuery.isLoading ||
    workoutSessionStatusQuery.isLoading;

  const workoutCta = useMemo(() => {
    if (signalReadyState && signalLifecycleRow?.status === "active") {
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
    if (workoutSessionStatusQuery.data) {
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
  }, [legacyActiveProgram, signalLifecycleRow?.status, signalReadyState, workoutSessionStatusQuery.data]);

  const handleContinueSignalProgram = useMemo(() => {
    if (!signalReadyState || signalReadyState.isProgramCompleted) return null;

    return () => {
      router.push("/(tabs)/workouts");
    };
  }, [signalReadyState]);

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

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar />}>
      <View className="gap-6 px-2">
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          PERFORMANCE PROTOCOL
        </Typography>
        <Typography variant="displayLg">{headlineTitle}</Typography>
      </View>

      {hasBlockingError ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Unable to load dashboard</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please pull to refresh or try again in a moment.
          </Typography>
          <AppButton
            onPress={() => {
              profileQuery.refetch();
              enrollmentsQuery.refetch();
              dashboardQuery.refetch();
              programsQuery.refetch();
              workoutQuery.refetch();
              workoutSessionStatusQuery.refetch();
            }}
            variant="secondary"
          >
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

      {isLoading ? <DashboardSkeleton /> : null}

      {!isLoading && !hasBlockingError ? (
      <View className="gap-gutter">
        <ActiveWorkoutBanner
          onOpenProgram={
            activeWorkoutBannerState.kind === "recovery" && activeWorkoutBannerState.programId
              ? () => {
                  router.push({
                    pathname: "/(signal)/program/[programId]",
                    params: { programId: activeWorkoutBannerState.programId ?? "" },
                  });
                }
              : null
          }
          onResume={() => {
            if (activeWorkoutBannerState.kind === "ready" && activeWorkoutBannerState.resumeParams) {
              router.push({
                pathname: "/(tabs)/workouts",
                params: activeWorkoutBannerState.resumeParams,
              });
              return;
            }

            router.push("/(tabs)/workouts");
          }}
          onRetry={() => activeWorkoutSessionQuery.refetch()}
          state={activeWorkoutBannerState}
        />

        <SignalProgramDashboardCard
          onBrowsePrograms={() => router.push("/(marketplace)")}
          onContinue={handleContinueSignalProgram}
          state={signalCardState}
        />

        <TodaySessionHero
          cta={workoutCta}
          focus={todayFocus}
          heroImage={heroImage}
          load={todayLoad}
          onPressCta={() => router.push(workoutCta.href)}
          sessionMinutes={sessionMinutes}
          title={todaySessionTitle}
        />

        {!hasAnyEnrollment ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No protocol started</Typography>
            <Typography tone="secondary" variant="bodyMd">
              You have not started a training protocol yet. Explore coach-led programs to begin your athlete flow.
            </Typography>
            <Link href="/(marketplace)" asChild>
              <AppButton variant="secondary">Explore Programs</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        <WolfAIDashboardSection />

        <EditorialCard className="gap-3">
          <View className="gap-1">
            <Typography tone="secondary" variant="labelSm">
              WORKOUT HISTORY
            </Typography>
            <Typography variant="headlineLg">Review completed sessions</Typography>
            <Typography tone="secondary" variant="bodyMd">
              See your recent finished workouts and logged set counts.
            </Typography>
          </View>
          <AppButton
            onPress={() => router.push("/(tabs)/history" as never)}
            variant="secondary"
          >
            View Workout History
          </AppButton>
        </EditorialCard>

        {hasAnyEnrollment && !workoutPlan ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No workout today</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your active protocol does not have a recoverable workout for today.
            </Typography>
            <Link href="/(marketplace)" asChild>
              <AppButton variant="secondary">Browse Training</AppButton>
            </Link>
          </EditorialCard>
        ) : null}

        <DashboardMetricCards
          dailyCalorieTarget={nutrition?.macroTargets?.daily_calorie_target}
          hasNutritionData={hasNutritionData}
          macroProgress={macroProgress}
          onLogFirstMeal={() => router.push("/(tabs)/nutrition")}
          weeklyDots={weeklyDots}
        />
      </View>
      ) : null}

      <FeaturedProgramsCarousel
        onViewAll={() => router.push("/(marketplace)")}
        programs={featuredPrograms}
      />
      </View>
    </ScreenScaffold>
  );
}

export const AthleteDashboardScreen = memo(AthleteDashboardScreenComponent);
