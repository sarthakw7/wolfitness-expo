import { memo, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/src/lib/cn";

import { Typography } from "./Typography";

type SectionHeaderProps = ViewProps & {
  action?: ReactNode;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

function SectionHeaderComponent({
  action,
  className,
  eyebrow,
  subtitle,
  title,
  ...props
}: SectionHeaderProps) {
  return (
    <View className={cn("flex-row items-end justify-between gap-3", className)} {...props}>
      <View className="flex-1 gap-1">
        {eyebrow ? (
          <Typography tone="accent" variant="labelSm">
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

export const SectionHeader = memo(SectionHeaderComponent);
