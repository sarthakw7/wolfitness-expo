import { memo, type ReactNode } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";

type SectionTitleProps = {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

function SectionTitleComponent({ action, eyebrow, subtitle, title }: SectionTitleProps) {
  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1 gap-1">
        {eyebrow ? (
          <Typography tone="secondary" variant="labelSm">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="headlineLg">{title}</Typography>
        {subtitle ? (
          <Typography tone="secondary" variant="bodyMd">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export const SectionTitle = memo(SectionTitleComponent);
