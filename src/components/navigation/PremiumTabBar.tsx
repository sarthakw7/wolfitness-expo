import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { memo, useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Typography } from "@/src/components/primitives";
import { chrome } from "@/src/constants/chrome";
import { colors, radius } from "@/src/theme";

const tabMeta = {
  index: { icon: "grid-outline", label: "Home" },
  workouts: { icon: "barbell-outline", label: "Workouts" },
  nutrition: { icon: "nutrition-outline", label: "Nutrition" },
  progress: { icon: "analytics-outline", label: "Progress" },
  profile: { icon: "person-outline", label: "Profile" },
} as const;

type TabRouteName = keyof typeof tabMeta;

function PremiumTabBarComponent({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, chrome.bottomTabFloatingGap);
  const routes = useMemo(
    () => state.routes.filter((route) => route.name in tabMeta),
    [state.routes],
  );

  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: bottomPadding }]}>
      <View className="mx-container overflow-hidden rounded-2xl border border-glass-border bg-glass" style={styles.bar}>
        {Platform.OS !== "android" ? (
          <BlurView intensity={22} style={StyleSheet.absoluteFill} tint="light" />
        ) : null}
        <View className="flex-row items-center justify-between px-2 py-2" style={styles.row}>
          {routes.map((route) => {
            const index = state.routes.findIndex((item) => item.key === route.key);
            const focused = state.index === index;
            const options = descriptors[route.key]?.options;
            const meta = tabMeta[route.name as TabRouteName];

            const onPress = () => {
              const event = navigation.emit({
                canPreventDefault: true,
                target: route.key,
                type: "tabPress",
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? meta.label}
                accessibilityRole="tab"
                accessibilityState={focused ? { selected: true } : undefined}
                className="flex-1 items-center justify-center gap-1 rounded-full"
                hitSlop={8}
                key={route.key}
                onPress={onPress}
                style={focused ? styles.activeTab : null}
              >
                <Ionicons
                  color={focused ? colors.graphite : colors.graphiteMuted}
                  name={meta.icon}
                  size={focused ? 22 : 20}
                />
                <Typography align="center" tone={focused ? "primary" : "secondary"} variant="labelSm">
                  {meta.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: colors.emeraldSoft,
  },
  bar: {
    borderColor: colors.glassBorder,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    height: chrome.bottomTabBarHeight,
    shadowColor: colors.graphite,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
  },
  row: {
    height: "100%",
  },
  outer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});

export const PremiumTabBar = memo(PremiumTabBarComponent);
