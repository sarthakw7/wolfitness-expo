import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";

import { getTargetGoalSuggestions } from "../lib/targetGoalSuggestions";
import type { GoalTypeValue } from "../types";

type TargetGoalSuggestionsProps = {
  goalType: GoalTypeValue | null;
  onSelect: (next: string) => void;
  value: string;
};

function TargetGoalSuggestionsComponent({ goalType, onSelect, value }: TargetGoalSuggestionsProps) {
  const suggestions = getTargetGoalSuggestions(goalType);
  const normalizedValue = value.trim().toLowerCase();

  if (!goalType || suggestions.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-3">
        <Typography tone="secondary" variant="bodyMd">
          Choose a goal type to see target ideas.
        </Typography>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between">
        <Typography variant="headlineLg">Target goal ideas</Typography>
        <Typography tone="secondary" variant="labelSm">
          Tap one to fill the field
        </Typography>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const active = normalizedValue === suggestion.trim().toLowerCase();
          return (
            <Pressable
              key={suggestion}
              accessibilityRole="button"
              className={cn(
                "rounded-full border px-3 py-2",
                active ? "border-emerald bg-emerald-soft" : "border-border bg-surface-raised",
              )}
              onPress={() => onSelect(suggestion)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <Typography tone={active ? "accent" : "primary"} variant="labelSm">
                {suggestion}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const TargetGoalSuggestions = memo(TargetGoalSuggestionsComponent);
