import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

export default function AuthLayout() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={isOnboardingComplete ? "/(tabs)" : "/(onboarding)"} />;
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
