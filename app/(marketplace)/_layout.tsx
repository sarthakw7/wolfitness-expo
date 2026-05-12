import { Stack } from "expo-router";

import { colors } from "@/src/theme";

export default function MarketplaceLayout() {
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
