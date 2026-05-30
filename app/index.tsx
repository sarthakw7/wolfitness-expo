import { Redirect } from "expo-router";
import { useEffect } from "react";

import { useWorkout, useWorkoutActiveSession, useWorkoutSessionStatus } from "@/src/hooks/queries";
import { AuthLandingScreen } from "@/src/screens/auth";
import { useAuth } from "@/src/hooks/useAuth";

export default function WelcomeRoute() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();
  const activeSessionQuery = useWorkoutActiveSession();
  const workoutQuery = useWorkout();
  const workoutSessionStatusQuery = useWorkoutSessionStatus(workoutQuery.data ?? null);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeSessionQuery.error) {
      console.warn("[workout-restore]", "Active session restore lookup failed.", {
        error:
          activeSessionQuery.error instanceof Error
            ? activeSessionQuery.error.message
            : String(activeSessionQuery.error),
      });
      return;
    }

    if (activeSessionQuery.data) {
      console.info("[workout-restore]", "Restoring athlete into workouts from active session.", {
        sessionId: activeSessionQuery.data.id,
      });
    }
  }, [activeSessionQuery.data, activeSessionQuery.error, isAuthenticated]);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    if (onboardingStatus === "incomplete") {
      console.info("[auth-debug] route redirect", {
        from: "/",
        navigationTarget: "/(preauth-onboarding)",
        reason: "onboarding-incomplete",
      });
      return <Redirect href="/(preauth-onboarding)" />;
    }

    if (activeSessionQuery.isLoading) {
      return null;
    }

    if (activeSessionQuery.data) {
      console.info("[auth-debug] route redirect", {
        from: "/",
        navigationTarget: "/(tabs)/workouts",
        reason: "active-workout-session",
      });
      return <Redirect href="/(tabs)/workouts" />;
    }

    if (workoutQuery.isLoading || workoutSessionStatusQuery.isLoading) {
      return null;
    }

    if (workoutSessionStatusQuery.data) {
      console.info("[auth-debug] route redirect", {
        from: "/",
        navigationTarget: "/(tabs)/workouts",
        reason: "workout-session-status",
      });
      return <Redirect href="/(tabs)/workouts" />;
    }

    console.info("[auth-debug] route redirect", {
      from: "/",
      navigationTarget: "/(tabs)",
      reason: "authenticated",
    });
    return <Redirect href="/(tabs)" />;
  }

  return <AuthLandingScreen />;
}
