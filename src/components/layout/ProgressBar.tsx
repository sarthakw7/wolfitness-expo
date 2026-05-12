import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, radius } from "@/src/theme";

type ProgressBarProps = ViewProps & {
  progress: number;
  tone?: "accent" | "graphite" | "muted";
};

const toneColor = {
  accent: colors.emerald,
  graphite: colors.graphite,
  muted: colors.graphiteSubtle,
} as const;

function ProgressBarComponent({
  className,
  progress,
  style,
  tone = "accent",
  ...props
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View
      className={cn("h-1 overflow-hidden bg-surface-muted", className)}
      style={[styles.track, style]}
      {...props}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: toneColor[tone],
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: radius.full,
    height: "100%",
  },
  track: {
    borderRadius: radius.full,
  },
});

export const ProgressBar = memo(ProgressBarComponent);
