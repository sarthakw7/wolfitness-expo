import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import type { SelectableOption } from "../types";

type SelectionGridProps<T extends string> = {
  label?: string;
  onChange: (next: T) => void;
  options: SelectableOption<T>[];
  value: T | null;
};

function SelectionGridComponent<T extends string>({ label, onChange, options, value }: SelectionGridProps<T>) {
  return (
    <View className="gap-3">
      {label ? <Typography variant="headlineLg">{label}</Typography> : null}
      <View className="flex-row flex-wrap gap-3">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              className={cn(
                "min-h-28 w-[48%] rounded-2xl border p-4",
                active ? "border-emerald bg-emerald/10" : "border-border bg-surface-raised",
              )}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <View className="flex-row items-start justify-between">
                <View
                  className={cn(
                    "h-10 w-10 items-center justify-center rounded-full border",
                    active ? "border-emerald bg-emerald/15" : "border-border bg-surface",
                  )}
                >
                  <Ionicons color={active ? colors.emerald : colors.graphiteMuted} name={option.icon} size={18} />
                </View>
                <View
                  className={cn(
                    "h-4 w-4 rounded-full border",
                    active ? "border-emerald bg-emerald" : "border-border",
                  )}
                />
              </View>
              <Typography className="mt-4" variant="headlineLg">
                {option.label}
              </Typography>
              <Typography className="mt-2" tone="secondary" variant="bodyMd">
                {option.description}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const SelectionGrid = memo(SelectionGridComponent) as typeof SelectionGridComponent;
