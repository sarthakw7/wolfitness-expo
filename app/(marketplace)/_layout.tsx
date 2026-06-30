import { Redirect, Stack, type Href } from "expo-router";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const authLandingHref = "/(auth)" as Href;

function debugAuthRoute(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

export default function MarketplaceLayout() {
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

  if (!isAuthenticated) {
    debugAuthRoute("route redirect", {
      from: "/(marketplace)",
      navigationTarget: authLandingHref,
      reason: "unauthenticated",
    });
    return <Redirect href={authLandingHref} />;
  }

  if (onboardingStatus === "incomplete") {
    debugAuthRoute("route redirect", {
      from: "/(marketplace)",
      navigationTarget: "/(preauth-onboarding)",
      reason: "onboarding-incomplete",
    });
    return <Redirect href="/(preauth-onboarding)" />;
  }

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.surface },
        headerShown: false,
      }}
    />
  );
}
