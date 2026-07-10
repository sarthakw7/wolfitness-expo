import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import type { WolfAISafetyCategory } from "../types";

type GuardrailMessageProps = {
  category: WolfAISafetyCategory;
  message: string;
  title?: string;
};

const categoryCopy: Record<Exclude<WolfAISafetyCategory, "allowed">, { title: string }> = {
  dehydration: { title: "Hydration caution" },
  eating_disorder: { title: "Nutrition safety" },
  emergency: { title: "Urgent safety" },
  extreme_diet: { title: "Safer nutrition guidance" },
  injury: { title: "Training caution" },
  medical: { title: "General fitness guidance only" },
  ped: { title: "Performance safety" },
};

function GuardrailMessageComponent({ category, message, title }: GuardrailMessageProps) {
  const copy = categoryCopy[category as Exclude<WolfAISafetyCategory, "allowed">] ?? categoryCopy.medical;

  return (
    <View className={cn("gap-2 rounded-2xl border border-border bg-surface-muted p-4")} style={{ borderColor: colors.dangerSoft }}>
      <Typography tone="danger" variant="labelSm">
        {copy.title}
      </Typography>
      {title ? <Typography variant="bodyMd">{title}</Typography> : null}
      <Typography tone="secondary" variant="bodyMd">
        {message}
      </Typography>
    </View>
  );
}

export const GuardrailMessage = memo(GuardrailMessageComponent);
