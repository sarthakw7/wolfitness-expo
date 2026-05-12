import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";

type CategoryPillProps = {
  active?: boolean;
  label: string;
};

function CategoryPillComponent({ active, label }: CategoryPillProps) {
  return (
    <View
      className={cn(
        "rounded-full border px-5 py-2.5",
        active ? "border-graphite bg-graphite" : "border-border bg-surface-raised",
      )}
    >
      <Typography tone={active ? "inverse" : "primary"} variant="labelSm">
        {label}
      </Typography>
    </View>
  );
}

export const CategoryPill = memo(CategoryPillComponent);
