import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import {
  formatSmartSyncStatusLabel,
  getSmartSyncStatusForProvider,
  SMART_SYNC_PROVIDER_OPTIONS,
} from "../constants";
import type { SmartSyncProviderValue } from "../types";

type SmartSyncProviderPickerProps = {
  label?: string;
  onChange: (next: SmartSyncProviderValue) => void;
  value: SmartSyncProviderValue;
};

function SmartSyncProviderPickerComponent({ label, onChange, value }: SmartSyncProviderPickerProps) {
  return (
    <View className="gap-3">
      {label ? <Typography variant="headlineLg">{label}</Typography> : null}

      <View className="gap-3">
        {SMART_SYNC_PROVIDER_OPTIONS.map((option) => {
          const active = value === option.value;
          const statusLabel = formatSmartSyncStatusLabel(getSmartSyncStatusForProvider(option.value));

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              className={cn(
                "rounded-2xl border p-4",
                active ? "border-emerald bg-emerald/10" : "border-border bg-surface-raised",
              )}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <View className="flex-row items-start gap-3">
                <View
                  className={cn(
                    "h-11 w-11 items-center justify-center rounded-full border",
                    active ? "border-emerald bg-emerald/15" : "border-border bg-surface",
                  )}
                >
                  <Ionicons color={active ? colors.emerald : colors.graphiteMuted} name={option.icon} size={18} />
                </View>

                <View className="flex-1 gap-1">
                  <Typography variant="labelMd">{option.label}</Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    {option.description}
                  </Typography>
                </View>

                <View className="items-end gap-2">
                  <View
                    className={cn(
                      "rounded-full px-3 py-1",
                      active ? "bg-emerald" : "bg-surface-muted",
                    )}
                  >
                    <Typography tone={active ? "inverse" : "secondary"} variant="labelSm">
                      {statusLabel}
                    </Typography>
                  </View>
                  {active ? <Ionicons color={colors.emerald} name="checkmark-circle" size={18} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const SmartSyncProviderPicker = memo(SmartSyncProviderPickerComponent);
