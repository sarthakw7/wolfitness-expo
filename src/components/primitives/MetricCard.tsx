import { memo, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/src/lib/cn";

import { GlassCard } from "./GlassCard";
import { Typography } from "./Typography";

type MetricCardProps = ViewProps & {
  accent?: ReactNode;
  label: string;
  meta?: string;
  value: string;
};

function MetricCardComponent({
  accent,
  className,
  label,
  meta,
  value,
  ...props
}: MetricCardProps) {
  return (
    <GlassCard className={cn("min-h-36 justify-between", className)} {...props}>
      <View className="flex-row items-start justify-between gap-3">
        <Typography tone="secondary" variant="labelSm">
          {label}
        </Typography>
        {accent}
      </View>
      <View className="gap-1">
        <Typography variant="displayLg">{value}</Typography>
        {meta ? (
          <Typography tone="secondary" variant="bodyMd">
            {meta}
          </Typography>
        ) : null}
      </View>
    </GlassCard>
  );
}

export const MetricCard = memo(MetricCardComponent);
