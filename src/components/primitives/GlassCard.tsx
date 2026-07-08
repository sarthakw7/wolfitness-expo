import { BlurView } from "expo-blur";
import { memo, type PropsWithChildren } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, elevation, radius } from "@/src/theme";

type GlassCardProps = PropsWithChildren<
  ViewProps & {
    intensity?: number;
    tier?: "glass" | "floating";
  }
>;

const styles = StyleSheet.create({
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: Platform.select({
      android: colors.surfaceGlassStrong,
      default: colors.surfaceGlass,
    }),
    borderColor: colors.glassBorder,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});

function GlassCardComponent({
  children,
  className,
  intensity = 20,
  style,
  tier = "glass",
  ...props
}: GlassCardProps) {
  return (
    <View
      className={cn("rounded-2xl border border-glass-border bg-glass p-5", className)}
      style={[styles.card, elevation[tier], style]}
      {...props}
    >
      {Platform.OS !== "android" ? (
        <BlurView intensity={intensity} style={styles.blurFill} tint="light" />
      ) : null}
      <View className="relative flex-1">{children}</View>
    </View>
  );
}

export const GlassCard = memo(GlassCardComponent);
