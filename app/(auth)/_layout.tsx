import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

export default function AuthLayout() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const navigationTarget = onboardingStatus === "incomplete" ? "/(preauth-onboarding)" : "/(tabs)";
    console.info("[auth-debug] route redirect", {
      from: "/(auth)",
      navigationTarget,
      reason: onboardingStatus === "incomplete" ? "onboarding-incomplete" : "authenticated",
    });
    return <Redirect href={navigationTarget} />;
  }

  return (
    <Stack
      screenOptions={{
        animation: "fade",
        contentStyle: { backgroundColor: colors.surface },
        headerShown: false,
      }}
    />
  );
}
