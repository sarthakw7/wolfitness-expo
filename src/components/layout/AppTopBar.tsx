import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard, Typography } from "@/src/components/primitives";
import { chrome } from "@/src/constants/chrome";
import { useAuth } from "@/src/hooks/useAuth";
import { colors, spacing } from "@/src/theme";

type AppTopBarProps = {
  back?: boolean;
  centered?: boolean;
  subtitle?: string;
  taskMode?: boolean;
  title?: string;
  onSettingsPress?: () => void;
};

function AppTopBarComponent({
  back,
  centered = true,
  subtitle,
  taskMode,
  title = "Wolfitness",
  onSettingsPress,
}: AppTopBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;

  return (
    <View className="z-10 w-full px-container" style={[styles.wrap, { paddingTop: insets.top + spacing[1] }]}>
      <GlassCard
        className="w-full px-2 py-2"
        intensity={16}
        style={styles.bar}
      >
        {/* NOTE: GlassCard wraps children in its own inner View, so we put our flex row inside explicitly. */}
        <View className="relative w-full flex-row items-center justify-between">
          <Pressable
            accessibilityLabel={back ? "Go back" : taskMode ? "Close" : "Open profile"}
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted"
            hitSlop={8}
            onPress={
              back
                ? () => router.back()
                : taskMode
                  ? () => router.back()
                  : () => router.push("/(tabs)/profile")
            }
          >
            {back || taskMode ? (
              <Ionicons color={colors.emeraldDeep} name={back ? "chevron-back" : "close"} size={20} />
            ) : avatarUrl ? (
              <Image accessibilityLabel="Profile" source={{ uri: avatarUrl }} style={{ height: "100%", width: "100%" }} />
            ) : (
              <Ionicons color={colors.emeraldDeep} name="person" size={20} />
            )}
          </Pressable>

          <View className="absolute left-16 right-16 items-center justify-center" pointerEvents="none">
            {subtitle ? (
              <Typography align="center" tone="secondary" variant="labelSm">
                {subtitle}
              </Typography>
            ) : null}
            <Typography align="center" variant={subtitle ? "labelMd" : "headlineLg"}>
              {title}
            </Typography>
          </View>

          <Pressable
            accessibilityLabel={taskMode ? "Skip exercise" : "Open settings"}
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            hitSlop={8}
            onPress={onSettingsPress}
          >
            <Ionicons
              color={colors.graphiteMuted}
              name={taskMode ? "play-skip-forward-outline" : "settings-outline"}
              size={20}
            />
          </Pressable>
        </View>
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
