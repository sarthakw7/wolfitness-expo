import { Redirect } from "expo-router";

import { useWorkout, useWorkoutSessionStatus } from "@/src/hooks/queries";
import { AuthLandingScreen } from "@/src/screens/auth";
import { useAuth } from "@/src/hooks/useAuth";

export default function WelcomeRoute() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();
  const workoutQuery = useWorkout();
  const workoutSessionStatusQuery = useWorkoutSessionStatus(workoutQuery.data ?? null);

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    if (onboardingStatus === "incomplete") {
      return <Redirect href="/(preauth-onboarding)" />;
    }

    if (workoutQuery.isLoading || workoutSessionStatusQuery.isLoading) {
      return null;
    }

    if (workoutSessionStatusQuery.data) {
      return <Redirect href="/(tabs)/workouts" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <AuthLandingScreen />;
}
