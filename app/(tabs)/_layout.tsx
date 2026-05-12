import { Tabs } from "expo-router";

import { PremiumTabBar } from "@/src/components/navigation";
import { colors } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
      tabBar={(props) => <PremiumTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition" }} />
      <Tabs.Screen name="progress" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
