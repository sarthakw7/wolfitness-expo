import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/hooks/useAuth";

export default function PreauthOnboardingLayout() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && onboardingStatus === "complete") {
    console.info("[auth-debug] route redirect", {
      from: "/(preauth-onboarding)",
      navigationTarget: "/(tabs)",
      reason: "onboarding-complete",
    });
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
