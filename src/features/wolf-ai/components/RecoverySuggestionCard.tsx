import { memo } from "react";
import { View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";
import { EditorialCard } from "@/src/components/layout";

import type { WolfAIError, WolfAIRecoverySuggestion, WolfAISafetyCategory } from "../types";
import { GuardrailMessage } from "./GuardrailMessage";
import { WolfAIErrorState } from "./WolfAIErrorState";
import { WolfAIDetailsToggle } from "./WolfAIDetailsToggle";
import { WolfAIStatusBadge } from "./WolfAIStatusBadge";

type RecoverySuggestionCardProps = {
  cached: boolean;
  data: WolfAIRecoverySuggestion | null;
  error: WolfAIError | null;
  hasIncompleteContext?: boolean;
  isLoading: boolean;
  isLimitReached: boolean;
  isRefreshing: boolean;
  onRefresh: () => Promise<void> | void;
  safetyCategory: WolfAISafetyCategory | null;
  usedFallback: boolean;
};

function statusTone(status: WolfAIRecoverySuggestion["status"]) {
  switch (status) {
    case "ready":
      return "accent" as const;
    case "moderate":
      return "warning" as const;
    case "recovery_first":
    default:
      return "danger" as const;
  }
}

function statusLabel(status: WolfAIRecoverySuggestion["status"]) {
  switch (status) {
    case "ready":
      return "Ready";
    case "moderate":
      return "Moderate";
    case "recovery_first":
    default:
      return "Recovery first";
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View className="flex-row gap-2" key={`${item}-${index}`}>
          <Typography tone="secondary" variant="bodyMd">
            •
          </Typography>
          <Typography variant="bodyMd">{item}</Typography>
        </View>
      ))}
    </View>
  );
}

function CompactBulletList({ items }: { items: string[] }) {
  return (
    <View className="gap-1.5">
      {items.map((item, index) => (
        <View className="flex-row gap-2" key={`${item}-${index}`}>
          <Typography tone="secondary" variant="bodyMd">
            •
          </Typography>
          <Typography variant="bodyMd" numberOfLines={2}>
            {item}
          </Typography>
        </View>
      ))}
    </View>
  );
}

function renderPlaceholderCopy() {
  return (
    <EditorialCard className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography tone="secondary" variant="labelSm">
            RECOVERY
          </Typography>
          <Typography variant="headlineLg">Recovery guidance</Typography>
        </View>
        <WolfAIStatusBadge label="Personalize" tone="neutral" />
      </View>
      <Typography tone="secondary" variant="bodyMd">
        Add your goal and health metrics for personalized recovery guidance.
      </Typography>
      <Typography tone="secondary" variant="labelSm">
        General recovery guidance will appear here once your data is available.
      </Typography>
    </EditorialCard>
  );
}

function RecoverySuggestionCardComponent({
  cached,
  data,
  error,
  hasIncompleteContext = false,
  isLoading,
  isLimitReached,
  isRefreshing,
  onRefresh,
  safetyCategory,
  usedFallback,
}: RecoverySuggestionCardProps) {
  if (isLoading && !data) {
    return (
      <EditorialCard className="gap-4">
        <View className="gap-2">
          <View className="h-4 w-28 rounded-full bg-surface-muted" />
          <View className="h-8 w-2/3 rounded-full bg-surface-muted" />
          <View className="h-4 w-full rounded-full bg-surface-muted" />
        </View>
        <View className="gap-2">
          <View className="h-4 w-40 rounded-full bg-surface-muted" />
          <View className="h-4 w-full rounded-full bg-surface-muted" />
          <View className="h-4 w-5/6 rounded-full bg-surface-muted" />
        </View>
      </EditorialCard>
    );
  }

  const refreshLabel = isRefreshing ? "Refreshing..." : "Refresh guidance";
  const showStaleNote = Boolean(data) && error?.code === "NETWORK_ERROR";
  const showLimitNote = Boolean(data) && error?.code === "LIMIT_REACHED";
  const showCacheBadge = cached && Boolean(data);
  const showFallbackBadge = usedFallback && Boolean(data) && !showCacheBadge;
  const isGuardrail = Boolean(safetyCategory && safetyCategory !== "allowed");
  const hasRefreshError = Boolean(data) && Boolean(error) && !["LIMIT_REACHED", "NETWORK_ERROR"].includes(error?.code ?? "");
  const visibleActions = data?.actions.slice(0, 3) ?? [];
  const hiddenActions = data?.actions.slice(3) ?? [];
  const whyPreview = data?.reasons.slice(0, 2).join(" • ") ?? "";

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
        title="Couldn’t refresh"
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
        title="Couldn’t load guidance"
      />
    );
  }

  if (!data && error?.code === "GUARDRAIL") {
    return (
      <EditorialCard className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              RECOVERY
            </Typography>
            <Typography variant="headlineLg">Safe guidance</Typography>
          </View>
          <WolfAIStatusBadge label="Safety" tone="danger" />
        </View>
        <GuardrailMessage category={safetyCategory ?? "medical"} message={error.message} title="Safe guidance" />
        <Typography tone="secondary" variant="bodyMd">
          Wolf AI returned a safety response instead of the requested guidance.
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
              RECOVERY
            </Typography>
            <Typography variant="headlineLg">{data.title}</Typography>
          </View>
          <View className="flex-row flex-wrap justify-end gap-2">
            <WolfAIStatusBadge label={statusLabel(data.status)} tone={statusTone(data.status)} />
            {showCacheBadge ? <WolfAIStatusBadge label="Cached" tone="neutral" /> : null}
            {showFallbackBadge ? <WolfAIStatusBadge label="Fallback" tone="warning" /> : null}
          </View>
        </View>

        {isGuardrail && safetyCategory ? (
          <GuardrailMessage category={safetyCategory} message={data.summary} title={data.title} />
        ) : (
          <WolfAIDetailsToggle
            details={
              <View className="gap-3 rounded-2xl border border-border bg-surface-muted p-4">
                <View className="gap-2">
                  <Typography tone="secondary" variant="labelSm">
                    Why this matters
                  </Typography>
                  <BulletList items={data.reasons} />
                </View>
                {hiddenActions.length > 0 ? (
                  <View className="gap-2">
                    <Typography tone="secondary" variant="labelSm">
                      More actions
                    </Typography>
                    <BulletList items={hiddenActions} />
                  </View>
                ) : null}
              </View>
            }
            summary={
              <View className="gap-2">
                <Typography tone="secondary" variant="bodyMd" numberOfLines={2}>
                  {data.summary}
                </Typography>
                {showStaleNote ? (
                  <Typography tone="secondary" variant="bodyMd">
                    Wolf AI couldn’t refresh right now. Showing your latest guidance.
                  </Typography>
                ) : null}

                {showLimitNote ? (
                  <Typography tone="secondary" variant="bodyMd">
                    Daily limit reached. Showing your cached guidance for today.
                  </Typography>
                ) : null}

                {hasRefreshError ? (
                  <Typography tone="secondary" variant="bodyMd">
                    Wolf AI guidance could not load right now. Showing your latest guidance.
                  </Typography>
                ) : null}

                {hasIncompleteContext ? (
                  <Typography tone="secondary" variant="bodyMd">
                    Add your goal and health metrics to personalize this guidance further.
                  </Typography>
                ) : null}

                <View className="gap-2">
                  <Typography variant="labelSm">Recommended actions</Typography>
                  <CompactBulletList items={visibleActions} />
                </View>
                {whyPreview ? (
                  <View className="gap-1">
                    <Typography variant="labelSm">Why</Typography>
                    <Typography tone="secondary" variant="bodyMd" numberOfLines={2}>
                      {whyPreview}
                    </Typography>
                  </View>
                ) : null}
                {hiddenActions.length > 0 ? (
                  <Typography tone="secondary" variant="labelSm">
                    {hiddenActions.length} more suggestion{hiddenActions.length === 1 ? "" : "s"} available in details.
                  </Typography>
                ) : null}
              </View>
            }
          />
        )}
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

export const RecoverySuggestionCard = memo(RecoverySuggestionCardComponent);
