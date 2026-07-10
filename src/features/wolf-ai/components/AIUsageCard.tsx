import { memo } from "react";
import { View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";
import { EditorialCard } from "@/src/components/layout";

import type { WolfAIError, WolfAITier } from "../types";
import { WolfAIStatusBadge } from "./WolfAIStatusBadge";

type AIUsageCardProps = {
  error: WolfAIError | null;
  isLoading: boolean;
  isLimitReached: boolean;
  limit: number;
  onRetry?: () => Promise<void> | void;
  remaining: number;
  tier: WolfAITier;
  used: number;
};

const tierLabel: Record<WolfAITier, string> = {
  elite: "Elite Plan",
  free: "Free Plan",
  pro: "Pro Plan",
};

function AIUsageCardComponent({ error, isLoading, isLimitReached, limit, onRetry, remaining, tier, used }: AIUsageCardProps) {
  if (isLoading && limit === 0 && used === 0) {
    return <EditorialCard className="gap-4 min-h-40 bg-surface-muted" />;
  }

  if (error && !isLimitReached) {
    return (
      <EditorialCard className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              WOLF AI USAGE
            </Typography>
            <Typography variant="headlineLg">Couldn’t load usage</Typography>
          </View>
          <WolfAIStatusBadge label="Network" tone="neutral" />
        </View>
        <Typography tone="secondary" variant="bodyMd">
          Wolf AI usage is unavailable right now.
        </Typography>
        {onRetry ? (
          <AppButton onPress={() => void Promise.resolve(onRetry()).catch(() => {})} size="sm" variant="secondary">
            Retry
          </AppButton>
        ) : null}
      </EditorialCard>
    );
  }

  const progress = limit > 0 ? Math.max(0, Math.min(1, used / limit)) : 0;
  const remainingLabel = remaining > 0 ? `${remaining} remaining today` : "You’ve used today’s Wolf AI actions. Your limit resets tomorrow.";

  return (
    <EditorialCard className="gap-4">
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              WOLF AI USAGE
            </Typography>
            <Typography variant="headlineLg">Wolf AI Usage</Typography>
          </View>
          <WolfAIStatusBadge label={tierLabel[tier]} tone={tier === "elite" ? "accent" : tier === "pro" ? "neutral" : "warning"} />
        </View>

        <Typography variant="bodyMd">
          {used} of {limit} actions used
        </Typography>
        <Typography tone="secondary" variant="bodyMd">
          {remainingLabel}
        </Typography>
      </View>

      <View className="gap-2">
        <View className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <View
            className="h-full rounded-full bg-emerald"
            style={{ width: `${Math.max(progress * 100, used > 0 && progress === 0 ? 4 : 0)}%` }}
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Typography tone="secondary" variant="labelSm">
            Resets daily
          </Typography>
          <Typography tone="secondary" variant="labelSm">
            {remaining > 0 ? `${remaining} remaining` : "Limit reached"}
          </Typography>
        </View>
      </View>

      {isLimitReached ? (
        <View className="rounded-2xl border border-border bg-surface-muted p-4">
          <Typography tone="danger" variant="bodyMd">
            You’ve used today’s Wolf AI actions. Your limit resets tomorrow.
          </Typography>
        </View>
      ) : null}
    </EditorialCard>
  );
}

export const AIUsageCard = memo(AIUsageCardComponent);
