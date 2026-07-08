import { useEffect, useRef, useState } from "react";

import {
  formatSmartSyncProviderLabel,
  formatSmartSyncStatusLabel,
  getSmartSyncProviderDescription,
  getSmartSyncStatusForProvider,
  normalizeSmartSyncProvider,
} from "../constants";
import type { SmartSyncProviderValue } from "../types";

import type { FitnessProfile } from "@/src/services/profile.service";

export function useSmartSyncForm(fitnessProfile: FitnessProfile | null, isLoading: boolean) {
  const hydratedRef = useRef(false);
  const [provider, setProvider] = useState<SmartSyncProviderValue>("manual");

  useEffect(() => {
    if (hydratedRef.current) return;
    if (isLoading) return;

    setProvider(normalizeSmartSyncProvider(fitnessProfile?.smart_sync_provider) ?? "manual");
    hydratedRef.current = true;
  }, [fitnessProfile?.smart_sync_provider, isLoading]);

  const selectedProvider = normalizeSmartSyncProvider(provider) ?? "manual";
  const selectedStatus =
    selectedProvider === "manual" ? "manual" : getSmartSyncStatusForProvider(selectedProvider);

  const selectedProviderLabel = formatSmartSyncProviderLabel(selectedProvider);
  const selectedStatusLabel = formatSmartSyncStatusLabel(selectedStatus);
  const selectedProviderDescription = getSmartSyncProviderDescription(selectedProvider);

  const canSave = Boolean(selectedProvider) && !isLoading;

  return {
    canSave,
    hydrated: hydratedRef.current,
    selectedProvider,
    selectedProviderDescription,
    selectedProviderLabel,
    selectedStatus,
    selectedStatusLabel,
    setProvider,
  };
}
