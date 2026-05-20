import { Redirect } from "expo-router";

import { AuthLandingScreen } from "@/src/screens/auth";
import { useAuth } from "@/src/hooks/useAuth";

export default function WelcomeRoute() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={isOnboardingComplete ? "/(tabs)" : "/(preauth-onboarding)"} />;
  }

  return <AuthLandingScreen />;
}
