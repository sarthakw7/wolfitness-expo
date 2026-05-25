import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

export default function AuthLayout() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href={onboardingStatus === "incomplete" ? "/(preauth-onboarding)" : "/(tabs)"} />;
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
