import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import { GOAL_TYPE_OPTIONS } from "../constants";
import type { GoalTypeValue } from "../types";

type GoalTypePillsProps = {
  label?: string;
  onChange: (next: GoalTypeValue) => void;
  value: GoalTypeValue | null;
};

function GoalTypePillsComponent({ label, onChange, value }: GoalTypePillsProps) {
  const selectedOption = GOAL_TYPE_OPTIONS.find((option) => option.value === value) ?? null;

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between">
        {label ? <Typography variant="headlineLg">{label}</Typography> : null}
        <Typography tone="secondary" variant="labelSm">
          {selectedOption ? "Selected" : "Choose one"}
        </Typography>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {GOAL_TYPE_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              className={cn(
                "min-h-11 rounded-full border px-4 py-2",
                active ? "border-emerald bg-emerald" : "border-border bg-surface-raised",
              )}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <View className="flex-row items-center gap-2">
                <Typography tone={active ? "inverse" : "primary"} variant="labelMd">
                  {option.label}
                </Typography>
                {active ? <Ionicons color={colors.white} name="checkmark" size={14} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedOption ? (
        <View className="rounded-2xl border border-border bg-surface-raised p-4">
          <Typography variant="labelMd">{selectedOption.label}</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            {selectedOption.description}
          </Typography>
        </View>
      ) : null}
    </View>
  );
}

export const GoalTypePills = memo(GoalTypePillsComponent);
