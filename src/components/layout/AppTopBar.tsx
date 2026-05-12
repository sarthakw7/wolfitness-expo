import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard, Typography } from "@/src/components/primitives";
import { chrome } from "@/src/constants/chrome";
import { colors, spacing } from "@/src/theme";

type AppTopBarProps = {
  back?: boolean;
  centered?: boolean;
  subtitle?: string;
  taskMode?: boolean;
  title?: string;
};

function AppTopBarComponent({
  back,
  centered,
  subtitle,
  taskMode,
  title = "Wolfitness",
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="z-10 px-container" style={[styles.wrap, { paddingTop: insets.top + spacing[1] }]}>
      <GlassCard className="flex-row items-center justify-between px-2 py-2" intensity={16} style={styles.bar}>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityLabel={back ? "Go back" : taskMode ? "Close workout" : "Open profile"}
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-muted"
            hitSlop={8}
            onPress={back ? () => router.back() : undefined}
          >
            <Ionicons
              color={colors.emeraldDeep}
              name={back ? "chevron-back" : taskMode ? "close" : "person"}
              size={20}
            />
          </Pressable>
          {!centered ? (
            <Typography variant="headlineLg">{title}</Typography>
          ) : null}
        </View>

        {centered ? (
          <View className="absolute left-20 right-20 items-center">
            {subtitle ? (
              <Typography align="center" tone="secondary" variant="labelSm">
                {subtitle}
              </Typography>
            ) : null}
            <Typography align="center" variant="labelMd">
              {title}
            </Typography>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel={taskMode ? "Skip exercise" : "Open settings"}
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full"
          hitSlop={8}
        >
          <Ionicons
            color={colors.graphiteMuted}
            name={taskMode ? "play-skip-forward-outline" : "settings-outline"}
            size={20}
          />
        </Pressable>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: chrome.topBarContentHeight,
  },
  wrap: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});

export const AppTopBar = memo(AppTopBarComponent);
