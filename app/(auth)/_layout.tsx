import { Stack } from "expo-router";

import { colors } from "@/src/theme";

export default function AuthLayout() {
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
