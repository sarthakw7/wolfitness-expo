import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { queryKeys } from "@/src/hooks/queries/queryKeys";
import { useWorkout, useWorkoutSessionStatus } from "@/src/hooks/queries";
import { AuthLandingScreen } from "@/src/screens/auth";
import { useAuth } from "@/src/hooks/useAuth";
import { workoutService } from "@/src/services";

function debugAuthRoute(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

function normalizeQueryError(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) {
    return {
      code: (error as { code?: string }).code ?? null,
      details: (error as { details?: string }).details ?? null,
      hint: (error as { hint?: string }).hint ?? null,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  if (typeof error === "object") {
    const candidate = error as {
      code?: string;
      details?: string;
      hint?: string;
      message?: string;
      stack?: string;
    };
    return {
      code: candidate.code ?? null,
      details: candidate.details ?? null,
      hint: candidate.hint ?? null,
      message: candidate.message ?? null,
      stack: candidate.stack ?? null,
    };
  }

  return {
    code: null,
    details: null,
    hint: null,
    message: String(error),
    stack: null,
  };
}

export default function WelcomeRoute() {
  const { bootstrapError, bootstrapPhase, isAuthenticated, isLoading, onboardingStatus, retryBootstrap, user } =
    useAuth();
  const userId = user?.id ?? null;
  const activeSessionQuery = useQuery({
    enabled: Boolean(userId),
    queryKey: userId ? queryKeys.workoutActiveSession(userId) : (["workout", "active-session", "anonymous"] as const),
    queryFn: async () => {
      if (!userId) return null;
      return workoutService.findAnyOpenWorkoutSessionForStartup(userId);
    },
    staleTime: 1000 * 15,
  });
  const workoutQuery = useWorkout();
  const workoutSessionStatusQuery = useWorkoutSessionStatus(workoutQuery.data ?? null);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeSessionQuery.error) {
      console.warn("[workout-restore]", "Active session restore lookup failed.", {
        error: normalizeQueryError(activeSessionQuery.error),
        query: "startupWorkoutSessionQuery",
      });
      return;
    }

    if (activeSessionQuery.data) {
      if (__DEV__) {
        console.info("[workout-restore]", "Restoring athlete into workouts from active session.", {
          sessionId: activeSessionQuery.data.id,
        });
      }
    }
  }, [activeSessionQuery.data, activeSessionQuery.error, isAuthenticated]);

  if (isLoading) {
    return (
      <BootstrapStateScreen
        isLoading
        message={bootstrapPhase === "checking-setup" ? "Checking your setup..." : "Restoring your session..."}
        title="Starting Wolfitness..."
      />
    );
  }

  if (bootstrapError) {
    return (
      <BootstrapStateScreen
        message={bootstrapError}
        onAction={() => {
          void retryBootstrap();
        }}
        title="Startup issue"
      />
    );
  }

  if (isAuthenticated) {
    if (onboardingStatus === "incomplete") {
      debugAuthRoute("route redirect", {
        from: "/",
        navigationTarget: "/(preauth-onboarding)",
        reason: "onboarding-incomplete",
      });
      return <Redirect href="/(preauth-onboarding)" />;
    }

    if (activeSessionQuery.isLoading) {
      return (
        <BootstrapStateScreen
          isLoading
          message="Checking for an unfinished workout."
          title="Restoring your session..."
        />
      );
    }

    if (activeSessionQuery.error) {
      return (
        <BootstrapStateScreen
          message="We couldn't restore your workout state."
          onAction={() => {
            void activeSessionQuery.refetch();
          }}
          title="Session restore failed"
        />
      );
    }

    if (activeSessionQuery.data) {
      debugAuthRoute("route redirect", {
        from: "/",
        navigationTarget: "/(tabs)/workouts",
        reason: "active-workout-session",
      });
      return <Redirect href="/(tabs)/workouts" />;
    }

    if (workoutQuery.isLoading || workoutSessionStatusQuery.isLoading) {
      return (
        <BootstrapStateScreen
          isLoading
          message="Checking your setup..."
          title="Starting Wolfitness..."
        />
      );
    }

    if (workoutQuery.error || workoutSessionStatusQuery.error) {
      const workoutError = normalizeQueryError(workoutQuery.error);
      const sessionStatusError = normalizeQueryError(workoutSessionStatusQuery.error);
      console.warn("[workout-restore]", "Workout startup query failed.", {
        queryErrors: {
          workoutQuery: workoutError,
          workoutSessionStatusQuery: sessionStatusError,
        },
      });
      return (
        <BootstrapStateScreen
          message="We couldn't finish loading your workout state."
          onAction={() => {
            void Promise.all([workoutQuery.refetch(), workoutSessionStatusQuery.refetch()]);
          }}
          title="Startup issue"
        />
      );
    }

    if (workoutSessionStatusQuery.data) {
      debugAuthRoute("route redirect", {
        from: "/",
        navigationTarget: "/(tabs)/workouts",
        reason: "workout-session-status",
      });
      return <Redirect href="/(tabs)/workouts" />;
    }

    debugAuthRoute("route redirect", {
      from: "/",
      navigationTarget: "/(tabs)",
      reason: "authenticated",
    });
    return <Redirect href="/(tabs)" />;
  }

  return <AuthLandingScreen />;
}
