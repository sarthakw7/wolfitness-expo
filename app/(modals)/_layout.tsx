import { Redirect, Stack, type Href } from "expo-router";

import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const authLandingHref = "/(auth)" as Href;

export default function ModalsLayout() {
  const { isAuthenticated, isLoading, onboardingStatus } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href={authLandingHref} />;
  }

  if (onboardingStatus === "incomplete") {
    return <Redirect href="/(preauth-onboarding)" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: colors.surface },
        headerShown: false,
        presentation: "modal",
      }}
    />
  );
}
