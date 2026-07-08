import { router } from "expo-router";
import { memo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { ModalSheet } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { ManualHealthMetricsForm } from "@/src/features/smart-sync/components/ManualHealthMetricsForm";
import { SmartSyncProviderPicker } from "@/src/features/smart-sync/components/SmartSyncProviderPicker";
import {
  formatSmartSyncProviderLabel,
  formatSmartSyncStatusLabel,
} from "@/src/features/smart-sync/constants";
import { useSmartSyncForm } from "@/src/features/smart-sync/hooks/useSmartSyncForm";
import { useTodayHealthMetrics } from "@/src/features/smart-sync/hooks/useTodayHealthMetrics";
import { useUpdateProfile } from "@/src/hooks/mutations";
import { useProfile } from "@/src/hooks/queries";
import { useAuth } from "@/src/hooks/useAuth";

function SmartSyncScreenComponent() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const form = useSmartSyncForm(profileQuery.data?.fitnessProfile ?? null, profileQuery.isLoading);
  const metricsForm = useTodayHealthMetrics();
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentProviderLabel = formatSmartSyncProviderLabel(form.selectedProvider) ?? "Manual Entry";
  const currentStatusLabel = formatSmartSyncStatusLabel(form.selectedStatus) ?? "Active";
  const isSaving = updateProfileMutation.isPending || metricsForm.isSaving;
  const canSave = form.canSave && metricsForm.canSave;

  const handleSave = async () => {
    if (!user?.id || !canSave) return;

    setSaveError(null);
    metricsForm.setSaveError(null);

    try {
      await updateProfileMutation.mutateAsync({
        smartSyncProvider: form.selectedProvider,
        smartSyncStatus: form.selectedStatus,
      });
      await metricsForm.saveTodayHealthMetrics();

      Alert.alert("Smart Sync updated", "Your sync preference and today’s metrics have been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save Smart Sync.";
      setSaveError(message);
      Alert.alert("Unable to save Smart Sync", message);
    }
  };

  if (profileQuery.error) {
    return (
      <ModalSheet eyebrow="Profile" title="Smart Sync">
        <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load Smart Sync</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
          <AppButton onPress={() => profileQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </View>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      eyebrow="Profile"
      footer={
        <View className="gap-3 rounded-2xl border border-emerald/20 bg-emerald/10 p-4">
          <Typography tone="secondary" variant="labelSm">
            Manual entry is the working launch feature. Device integrations will be added later.
          </Typography>
          <AppButton
            className="w-full rounded-full bg-emerald border-emerald"
            disabled={!canSave}
            isLoading={isSaving}
            onPress={handleSave}
            size="lg"
            style={{ backgroundColor: "#0F9D58", borderColor: "#0F9D58" }}
            variant="secondary"
          >
            {isSaving ? "Saving..." : "Save Smart Sync"}
          </AppButton>
        </View>
      }
      title="Smart Sync"
    >
      {profileQuery.isLoading && !form.hydrated ? (
        <View className="items-center justify-center rounded-2xl border border-border bg-surface-raised py-10">
          <ActivityIndicator />
        </View>
      ) : null}

      <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Smart Sync</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Choose a sync source and capture today&apos;s health metrics now. Manual entry is the launch-ready workflow.
        </Typography>
        <View className="flex-row flex-wrap gap-2 pt-1">
          <View className="rounded-full bg-surface-muted px-3 py-1.5">
            <Typography tone="secondary" variant="labelSm">
              {currentProviderLabel}
            </Typography>
          </View>
          <View className="rounded-full bg-surface-muted px-3 py-1.5">
            <Typography tone="secondary" variant="labelSm">
              {currentStatusLabel}
            </Typography>
          </View>
        </View>
      </View>

      <SmartSyncProviderPicker
        label="Sync Source"
        onChange={(next) => {
          setSaveError(null);
          metricsForm.setSaveError(null);
          form.setProvider(next);
        }}
        value={form.selectedProvider}
      />

      <ManualHealthMetricsForm
        errors={metricsForm.errors}
        onChange={(field, value) => {
          setSaveError(null);
          metricsForm.setSaveError(null);
          metricsForm.setField(field, value);
        }}
        values={metricsForm.values}
      />

      <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Today&apos;s summary</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {metricsForm.summaryText}
        </Typography>
      </View>

      {saveError ? (
        <Typography tone="danger" variant="labelSm">
          {saveError}
        </Typography>
      ) : null}
    </ModalSheet>
  );
}

export const SmartSyncScreen = memo(SmartSyncScreenComponent);
