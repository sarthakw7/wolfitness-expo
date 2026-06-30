import { Redirect, Stack, type Href } from "expo-router";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const authLandingHref = "/(auth)" as Href;

export default function SignalLayout() {
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
    return <Redirect href={authLandingHref} />;
  }

  if (onboardingStatus === "incomplete") {
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
