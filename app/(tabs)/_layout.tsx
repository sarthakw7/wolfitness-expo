import { Redirect, Tabs, useGlobalSearchParams, useSegments, type Href } from "expo-router";

import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { PremiumTabBar } from "@/src/components/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const authLandingHref = "/(auth)" as Href;

function singleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function debugAuthRoute(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

export default function TabsLayout() {
  const { bootstrapError, bootstrapPhase, isAuthenticated, isLoading, onboardingStatus, retryBootstrap } = useAuth();
  const segments = useSegments();
  const params = useGlobalSearchParams<{
    signalDayId?: string | string[];
    signalProgramId?: string | string[];
    signalWeekId?: string | string[];
  }>();
  const isSignalWorkoutPlayerRoute =
    segments[0] === "(tabs)" &&
    segments[1] === "workouts" &&
    Boolean(singleParam(params.signalProgramId) || singleParam(params.signalWeekId) || singleParam(params.signalDayId));

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
      from: "/(tabs)",
      navigationTarget: authLandingHref,
      reason: "unauthenticated",
    });
    return <Redirect href={authLandingHref} />;
  }

  if (onboardingStatus === "incomplete") {
    debugAuthRoute("route redirect", {
      from: "/(tabs)",
      navigationTarget: "/(preauth-onboarding)",
      reason: "onboarding-incomplete",
    });
    return <Redirect href="/(preauth-onboarding)" />;
  }

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
      tabBar={(props) => (isSignalWorkoutPlayerRoute ? null : <PremiumTabBar {...props} />)}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="history" options={{ href: null, title: "History" }} />
      <Tabs.Screen name="history/[sessionId]" options={{ href: null, title: "Workout Session" }} />
      <Tabs.Screen name="settings" options={{ href: null, title: "Settings" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
