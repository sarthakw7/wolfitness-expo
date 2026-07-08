import type { SmartSyncProviderOption, SmartSyncProviderValue, SmartSyncStatusValue } from "./types";

export const SMART_SYNC_PROVIDER_OPTIONS: SmartSyncProviderOption[] = [
  {
    value: "manual",
    label: "Manual Entry",
    description: "Add health metrics yourself today.",
    icon: "create-outline",
  },
  {
    value: "apple_watch",
    label: "Apple Watch",
    description: "Coming soon - device sync placeholder.",
    icon: "watch-outline",
  },
  {
    value: "samsung_health",
    label: "Samsung Health",
    description: "Coming soon - device sync placeholder.",
    icon: "phone-portrait-outline",
  },
  {
    value: "health_connect",
    label: "Health Connect",
    description: "Coming soon - device sync placeholder.",
    icon: "fitness-outline",
  },
  {
    value: "fitbit",
    label: "Fitbit",
    description: "Coming soon - device sync placeholder.",
    icon: "pulse-outline",
  },
  {
    value: "whoop",
    label: "Whoop",
    description: "Coming soon - device sync placeholder.",
    icon: "speedometer-outline",
  },
  {
    value: "withings",
    label: "Withings",
    description: "Coming soon - device sync placeholder.",
    icon: "scale-outline",
  },
];

const SMART_SYNC_PROVIDER_LABELS: Record<SmartSyncProviderValue, string> = {
  apple_watch: "Apple Watch",
  fitbit: "Fitbit",
  health_connect: "Health Connect",
  manual: "Manual Entry",
  samsung_health: "Samsung Health",
  whoop: "Whoop",
  withings: "Withings",
};

const SMART_SYNC_STATUS_LABELS: Record<SmartSyncStatusValue, string> = {
  coming_soon: "Coming soon",
  connected: "Connected",
  manual: "Active",
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

export function normalizeSmartSyncProvider(value: string | null | undefined): SmartSyncProviderValue | null {
  if (!value) return null;
  const slug = normalizeSlug(value);

  switch (slug) {
    case "apple_watch":
    case "applewatch":
      return "apple_watch";
    case "samsung_health":
    case "samsunghealth":
      return "samsung_health";
    case "google_fit":
    case "googlefit":
      return "health_connect";
    case "health_connect":
    case "healthconnect":
      return "health_connect";
    case "fitbit":
      return "fitbit";
    case "whoop":
      return "whoop";
    case "withings":
      return "withings";
    case "manual":
    case "manual_entry":
    case "manualentry":
      return "manual";
    default:
      return null;
  }
}

export function normalizeSmartSyncStatus(value: string | null | undefined): SmartSyncStatusValue | null {
  if (!value) return null;
  const slug = normalizeSlug(value);
  if (slug === "coming_soon" || slug === "connected" || slug === "manual") {
    return slug as SmartSyncStatusValue;
  }
  return null;
}

export function getSmartSyncStatusForProvider(value: SmartSyncProviderValue): SmartSyncStatusValue {
  return value === "manual" ? "manual" : "coming_soon";
}

export function formatSmartSyncProviderLabel(value: string | null | undefined): string | null {
  const normalized = normalizeSmartSyncProvider(value);
  if (normalized) return SMART_SYNC_PROVIDER_LABELS[normalized];
  if (!value) return null;
  return titleCase(value);
}

export function formatSmartSyncStatusLabel(value: string | null | undefined): string | null {
  const normalized = normalizeSmartSyncStatus(value);
  if (normalized) return SMART_SYNC_STATUS_LABELS[normalized];
  if (!value) return null;
  return titleCase(value);
}

export function getSmartSyncProviderDescription(value: SmartSyncProviderValue | null | undefined): string {
  if (value === "manual" || !value) {
    return "Add health metrics yourself today.";
  }

  return "Coming soon - device sync placeholder.";
}
