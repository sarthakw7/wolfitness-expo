import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

type WolfAIStatusBadgeTone = "accent" | "danger" | "neutral" | "warning";

type WolfAIStatusBadgeProps = {
  label: string;
  tone?: WolfAIStatusBadgeTone;
};

const toneStyles: Record<WolfAIStatusBadgeTone, { backgroundColor: string; borderColor: string; textTone: "accent" | "danger" | "secondary" }> = {
  accent: {
    backgroundColor: colors.emeraldSoft,
    borderColor: colors.emerald,
    textTone: "accent",
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    textTone: "danger",
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    textTone: "secondary",
  },
  warning: {
    backgroundColor: colors.raw.surfaceContainerLow,
    borderColor: colors.raw.outlineVariant,
    textTone: "secondary",
  },
};

function WolfAIStatusBadgeComponent({ label, tone = "neutral" }: WolfAIStatusBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <View
      className={cn("rounded-full border px-2 py-0.5")}
      style={{ backgroundColor: styles.backgroundColor, borderColor: styles.borderColor }}
    >
      <Typography tone={styles.textTone} variant="labelSm">
        {label}
      </Typography>
    </View>
  );
}

export const WolfAIStatusBadge = memo(WolfAIStatusBadgeComponent);
