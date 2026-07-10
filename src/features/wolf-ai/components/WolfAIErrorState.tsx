import { memo } from "react";
import { View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";

import { WolfAIStatusBadge } from "./WolfAIStatusBadge";

type WolfAIErrorStateProps = {
  actionLabel?: string;
  body: string;
  badgeLabel: string;
  badgeTone?: "accent" | "danger" | "neutral" | "warning";
  helperText?: string;
  onAction?: () => Promise<void> | void;
  title: string;
};

function WolfAIErrorStateComponent({
  actionLabel,
  body,
  badgeLabel,
  badgeTone = "danger",
  helperText,
  onAction,
  title,
}: WolfAIErrorStateProps) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-surface-muted p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography tone="secondary" variant="labelSm">
            WOLF AI
          </Typography>
          <Typography variant="headlineLg">{title}</Typography>
        </View>
        <WolfAIStatusBadge label={badgeLabel} tone={badgeTone} />
      </View>

      <Typography tone="secondary" variant="bodyMd">
        {body}
      </Typography>

      {helperText ? (
        <Typography tone="secondary" variant="labelSm">
          {helperText}
        </Typography>
      ) : null}

      {actionLabel && onAction ? (
        <AppButton onPress={() => void Promise.resolve(onAction()).catch(() => {})} size="sm" variant="secondary">
          {actionLabel}
        </AppButton>
      ) : null}
    </View>
  );
}

export const WolfAIErrorState = memo(WolfAIErrorStateComponent);
