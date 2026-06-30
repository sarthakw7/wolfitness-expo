import { Redirect, Stack } from "expo-router";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { useAuth } from "@/src/hooks/useAuth";

function debugAuthRoute(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

export default function PreauthOnboardingLayout() {
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

  if (isAuthenticated && onboardingStatus === "complete") {
    debugAuthRoute("route redirect", {
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
