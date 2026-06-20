import "react-native-gesture-handler";

import "@/global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/src/providers/AppProviders";
import { useAppFonts } from "@/src/hooks/useAppFonts";
import { useAuth } from "@/src/hooks/useAuth";
import { validateNutritionApiConfiguration } from "@/src/services/nutrition.service";
import { colors } from "@/src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // The splash screen may already be hidden during fast refresh.
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.surface).catch(() => {
      // Non-critical on platforms that do not expose system background control.
    });
    validateNutritionApiConfiguration();
  }, []);

  // We allow the app to continue even if fonts fail, it will just fallback to system fonts.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar backgroundColor={colors.surface} style="dark" translucent />
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {
        // The splash screen may already be hidden during fast refresh.
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
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
