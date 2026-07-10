import { memo } from "react";
import { View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";
import { EditorialCard } from "@/src/components/layout";

import type { WolfAIDailyGoalInsight, WolfAIError, WolfAISafetyCategory } from "../types";
import { GuardrailMessage } from "./GuardrailMessage";
import { WolfAIErrorState } from "./WolfAIErrorState";
import { WolfAIDetailsToggle } from "./WolfAIDetailsToggle";
import { WolfAIStatusBadge } from "./WolfAIStatusBadge";
import { formatWolfAILabel } from "../lib/formatWolfAILabel";

type DailyGoalInsightCardProps = {
  cached: boolean;
  data: WolfAIDailyGoalInsight | null;
  error: WolfAIError | null;
  hasIncompleteGoalProfile?: boolean;
  isLoading: boolean;
  isLimitReached: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void> | void;
  safetyCategory: WolfAISafetyCategory | null;
  usedFallback: boolean;
};

function toneLabel(tone: WolfAIDailyGoalInsight["tone"]) {
  switch (tone) {
    case "motivating":
      return "Motivating";
    case "recovery":
      return "Recovery";
    case "consistency":
    default:
      return "Consistency";
  }
}

function toneVariant(tone: WolfAIDailyGoalInsight["tone"]) {
  switch (tone) {
    case "motivating":
      return "accent" as const;
    case "recovery":
      return "warning" as const;
    case "consistency":
    default:
      return "neutral" as const;
  }
}

function summarizeMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "";

  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0]?.trim() ?? trimmed;
  if (firstSentence.length <= 140) return firstSentence;

  return `${firstSentence.slice(0, 137).trimEnd()}...`;
}

function formatGoalTitle(value: string) {
  const formatted = formatWolfAILabel(value);
  if (!formatted) return "Daily insight";

  return /focus$/i.test(formatted) ? formatted : `${formatted} Focus`;
}

function renderPlaceholderCopy() {
  return (
    <EditorialCard className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography tone="secondary" variant="labelSm">
            WOLF AI
          </Typography>
          <Typography variant="headlineLg">Daily insight</Typography>
        </View>
        <WolfAIStatusBadge label="Personalize" tone="neutral" />
      </View>
      <Typography tone="secondary" variant="bodyMd">
        Add your goal and health metrics for personalized guidance.
      </Typography>
      <Typography tone="secondary" variant="labelSm">
        Daily insight will appear here once your profile and activity data are available.
      </Typography>
    </EditorialCard>
  );
}

function DailyGoalInsightCardComponent({
  cached,
  data,
  error,
  hasIncompleteGoalProfile = false,
  isLoading,
  isLimitReached,
  isRefreshing,
  onRefresh,
  safetyCategory,
  usedFallback,
}: DailyGoalInsightCardProps) {
  if (isLoading && !data) {
    return (
      <EditorialCard className="gap-4">
        <View className="gap-2">
          <View className="h-4 w-24 rounded-full bg-surface-muted" />
          <View className="h-8 w-2/3 rounded-full bg-surface-muted" />
          <View className="h-4 w-full rounded-full bg-surface-muted" />
        </View>
        <View className="h-20 w-full rounded-2xl bg-surface-muted" />
        <View className="gap-2">
          <View className="h-10 w-full rounded-full bg-surface-muted" />
          <View className="h-4 w-4/5 rounded-full bg-surface-muted" />
        </View>
      </EditorialCard>
    );
  }

  const showCacheBadge = cached && Boolean(data);
  const showFallbackBadge = usedFallback && Boolean(data) && !showCacheBadge;
  const refreshLabel = isRefreshing ? "Refreshing..." : "Refresh insight";
  const isGuardrail = Boolean(safetyCategory && safetyCategory !== "allowed");
  const hasRefreshError = Boolean(data) && Boolean(error) && !["LIMIT_REACHED", "NETWORK_ERROR"].includes(error?.code ?? "");

  if (!data && error?.code === "LIMIT_REACHED") {
    return (
      <WolfAIErrorState
        actionLabel="Retry"
        badgeLabel="Limit reached"
        badgeTone="danger"
        body="You’ve used today’s Wolf AI actions. Your limit resets tomorrow."
        helperText="Cached guidance will stay visible when available."
        onAction={onRefresh}
        title="Daily limit reached"
      />
    );
  }

  if (!data && error?.code === "NETWORK_ERROR") {
    return (
      <WolfAIErrorState
        actionLabel="Retry"
        badgeLabel="Network"
        badgeTone="neutral"
        body="Wolf AI couldn’t refresh right now. Your latest guidance will appear here when the network is available."
        helperText="Cached guidance will stay visible when available."
        onAction={onRefresh}
        title="Couldn’t refresh insight"
      />
    );
  }

  if (!data && error?.code === "UNAUTHORIZED") {
    return (
      <WolfAIErrorState
        actionLabel="Retry"
        badgeLabel="Sign in"
        badgeTone="danger"
        body="Wolf AI needs you to sign in again."
        helperText="If you recently signed in, tap Retry once more to refresh your session."
        onAction={onRefresh}
        title="Session needed"
      />
    );
  }

  if (!data && error?.code === "INTERNAL_ERROR") {
    return (
      <WolfAIErrorState
        actionLabel="Retry"
        badgeLabel="Error"
        badgeTone="danger"
        body="Wolf AI guidance could not load right now."
        helperText="We’ll keep trying to show guidance when the service is available."
        onAction={onRefresh}
        title="Couldn’t load insight"
      />
    );
  }

  if (!data && error?.code === "GUARDRAIL") {
    return (
      <EditorialCard className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              WOLF AI
            </Typography>
            <Typography variant="headlineLg">Safe guidance</Typography>
          </View>
          <WolfAIStatusBadge label="Safety" tone="danger" />
        </View>
        <GuardrailMessage category={safetyCategory ?? "medical"} message={error.message} title="Safe guidance" />
        <Typography tone="secondary" variant="bodyMd">
          Wolf AI returned a safety response instead of the requested insight.
        </Typography>
        <AppButton onPress={() => void Promise.resolve(onRefresh()).catch(() => {})} size="sm" variant="secondary">
          Retry
        </AppButton>
      </EditorialCard>
    );
  }

  if (!data) {
    return renderPlaceholderCopy();
  }

  return (
    <EditorialCard className="gap-3">
      <View className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              WOLF AI
            </Typography>
            <Typography variant="headlineLg">{formatGoalTitle(data.title)}</Typography>
          </View>
          <View className="flex-row flex-wrap justify-end gap-2">
            <WolfAIStatusBadge label={toneLabel(data.tone)} tone={toneVariant(data.tone)} />
            {showCacheBadge ? <WolfAIStatusBadge label="Cached" tone="neutral" /> : null}
            {showFallbackBadge ? <WolfAIStatusBadge label="Fallback" tone="warning" /> : null}
          </View>
        </View>

        {hasRefreshError ? (
          <Typography tone="secondary" variant="bodyMd">
            Wolf AI guidance could not load right now. Showing your latest insight.
          </Typography>
        ) : null}

        {hasIncompleteGoalProfile ? (
          <Typography tone="secondary" variant="bodyMd">
            Complete your Goal Profile to receive more personalized daily guidance.
          </Typography>
        ) : null}

        {isGuardrail && safetyCategory ? (
          <GuardrailMessage category={safetyCategory} message={data.message} title={data.title} />
        ) : (
          <WolfAIDetailsToggle
            details={
              <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
                <Typography tone="secondary" variant="labelSm">
                  Expanded insight
                </Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {data.message}
                </Typography>
              </View>
            }
            summary={
              <Typography tone="secondary" variant="bodyMd" numberOfLines={3}>
                {summarizeMessage(data.message)}
              </Typography>
            }
          />
        )}
      </View>

      <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
        <Typography tone="secondary" variant="labelSm">
          Action
        </Typography>
        <Typography variant="bodyMd">{data.action}</Typography>
      </View>

      <View className="gap-2">
        <AppButton
          disabled={isLimitReached || isRefreshing}
          isLoading={isRefreshing}
          onPress={() => void Promise.resolve(onRefresh()).catch(() => {})}
          size="sm"
          variant="secondary"
        >
          {refreshLabel}
        </AppButton>
        <Typography tone="secondary" variant="labelSm">
          Refreshing uses 1 Wolf AI action.
        </Typography>
      </View>
    </EditorialCard>
  );
}

export const DailyGoalInsightCard = memo(DailyGoalInsightCardComponent);
