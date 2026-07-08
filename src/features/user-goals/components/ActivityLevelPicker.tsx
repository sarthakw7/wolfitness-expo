import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import { ACTIVITY_LEVEL_OPTIONS } from "../constants";
import type { ActivityLevelValue } from "../types";

type ActivityLevelPickerProps = {
  label?: string;
  onChange: (next: ActivityLevelValue) => void;
  value: ActivityLevelValue | null;
};

function ActivityLevelPickerComponent({ label, onChange, value }: ActivityLevelPickerProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between">
        {label ? <Typography variant="headlineLg">{label}</Typography> : null}
        <Typography tone="secondary" variant="labelSm">
          Required
        </Typography>
      </View>

      <View className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
        {ACTIVITY_LEVEL_OPTIONS.map((option, index) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              className={cn("flex-row items-center gap-3 px-4 py-3", index > 0 ? "border-t border-border" : null)}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <View
                className={cn(
                  "h-4 w-4 rounded-full border",
                  active ? "border-emerald bg-emerald" : "border-border bg-transparent",
                )}
              />
              <View className="flex-1">
                <Typography variant="labelMd">{option.label}</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  {option.description}
                </Typography>
              </View>
              {active ? <Ionicons color={colors.emerald} name="checkmark" size={16} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const ActivityLevelPicker = memo(ActivityLevelPickerComponent);
