import "react-native-gesture-handler";

import "@/global.css";

import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/src/providers/AppProviders";
import { BootstrapStateScreen } from "@/src/components/layout/BootstrapStateScreen";
import { useAppFonts } from "@/src/hooks/useAppFonts";
import { useAuth } from "@/src/hooks/useAuth";
import { initSentry, isSentryConfigured } from "@/src/lib/sentry";
import { validateNutritionApiConfiguration } from "@/src/services/nutrition.service";
import { colors } from "@/src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen may already be hidden during fast refresh.
});

initSentry();

function RootErrorFallback() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.surface,
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          color: colors.graphite,
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          color: colors.graphiteMuted,
          fontSize: 16,
          lineHeight: 22,
          textAlign: "center",
        }}
      >
        The app hit an unexpected error. Please restart Wolfitness and try again.
      </Text>
    </View>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.surface).catch(() => {
      // Non-critical on platforms that do not expose system background control.
    });
    validateNutritionApiConfiguration();
  }, []);

  // We allow the app to continue even if fonts fail, it will just fallback to system fonts.
  if (!fontsLoaded && !fontError) {
    return (
      <BootstrapStateScreen
        isLoading
        message="Loading app resources."
        title="Starting Wolfitness..."
      />
    );
  }

  return (
    <Sentry.ErrorBoundary fallback={RootErrorFallback}>
      <AppProviders>
        <StatusBar backgroundColor={colors.surface} style="dark" translucent />
        <RootNavigator />
      </AppProviders>
    </Sentry.ErrorBoundary>
  );
}

function RootNavigator() {
  const { bootstrapError, bootstrapPhase, isLoading, retryBootstrap } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // The splash screen may already be hidden during fast refresh.
    });
  }, []);

  if (isLoading) {
    const message =
      bootstrapPhase === "checking-setup"
        ? "Checking your setup..."
        : "Restoring your session...";

    return <BootstrapStateScreen isLoading message={message} title="Starting Wolfitness..." />;
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

  return (
    <Stack
      screenOptions={{
        animation: "fade",
        contentStyle: { backgroundColor: colors.surface },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="(marketplace)"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="(signal)"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(preauth-onboarding)" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="auth/reset-password" />
      <Stack.Screen
        name="(modals)"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

const Root = isSentryConfigured() ? Sentry.wrap(RootLayout) : RootLayout;

export default Root;
