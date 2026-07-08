import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";
import { Chip, EditorialCard } from "@/src/components/layout";

import {
  formatSmartSyncProviderLabel,
  formatSmartSyncStatusLabel,
  getSmartSyncStatusForProvider,
  normalizeSmartSyncProvider,
} from "../constants";
import { formatMetricPreview } from "../lib/health-metrics";
import type { HealthMetricSummaryFields } from "../types";

type SmartSyncCardProps = {
  onManage: () => void;
  provider?: string | null;
  status?: string | null;
  todayMetrics?: HealthMetricSummaryFields | null;
};

function SmartSyncCardComponent({ onManage, provider, todayMetrics }: SmartSyncCardProps) {
  const normalizedProvider = normalizeSmartSyncProvider(provider) ?? "manual";
  const normalizedStatus = formatSmartSyncStatusLabel(getSmartSyncStatusForProvider(normalizedProvider));
  const providerLabel = formatSmartSyncProviderLabel(normalizedProvider) ?? "Manual Entry";
  const statusLabel = normalizedStatus ?? "Active";
  const summaryLabel = formatMetricPreview(todayMetrics);
  const bodyCopy =
    normalizedProvider === "manual"
      ? "Manual entry is active today. Device sync integrations are coming soon."
      : `${providerLabel} is coming soon. Manual entry is available today.`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Open Smart Sync settings"
      className="active:opacity-95"
      onPress={onManage}
      style={({ pressed }) => (pressed ? { opacity: 0.96 } : null)}
    >
      <EditorialCard className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <Typography variant="headlineLg">Smart Sync</Typography>
              <Ionicons color="#6B7280" name="chevron-forward" size={18} />
            </View>
            <Typography tone="secondary" variant="bodyMd">
              {bodyCopy}
            </Typography>
          </View>
          <View className="rounded-full bg-surface-muted px-3 py-1.5">
            <Typography tone="secondary" variant="labelSm">
              {statusLabel}
            </Typography>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Chip active label={providerLabel} />
          <Chip label={statusLabel} />
        </View>

        <Typography tone="secondary" variant="bodyMd">
          {summaryLabel}
        </Typography>

        <AppButton onPress={onManage} variant="secondary">
          Manage Smart Sync
        </AppButton>
      </EditorialCard>
    </Pressable>
  );
}

export const SmartSyncCard = memo(SmartSyncCardComponent);
