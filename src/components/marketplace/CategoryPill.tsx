import { memo } from "react";
import { Pressable } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";

type CategoryPillProps = {
  active?: boolean;
  label: string;
  onPress?: () => void;
};

function CategoryPillComponent({ active, label, onPress }: CategoryPillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "rounded-full border px-5 py-2.5",
        active ? "border-graphite bg-graphite" : "border-border bg-surface-raised",
      )}
      onPress={onPress}
    >
      <Typography tone={active ? "inverse" : "primary"} variant="labelSm">
        {label}
      </Typography>
    </Pressable>
  );
}

export const CategoryPill = memo(CategoryPillComponent);
