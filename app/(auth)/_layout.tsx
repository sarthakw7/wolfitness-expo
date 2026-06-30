import { Redirect, Stack } from "expo-router";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

function debugAuthRoute(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

export default function AuthLayout() {
  const { bootstrapError, bootstrapPhase, isAuthenticated, isLoading, onboardingStatus, retryBootstrap } = useAuth();

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
    const navigationTarget = onboardingStatus === "incomplete" ? "/(preauth-onboarding)" : "/(tabs)";
    debugAuthRoute("route redirect", {
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
