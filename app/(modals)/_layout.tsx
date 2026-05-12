import { Stack } from "expo-router";

import { colors } from "@/src/theme";

export default function ModalsLayout() {
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
