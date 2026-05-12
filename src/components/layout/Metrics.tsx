import { Ionicons } from "@expo/vector-icons";
import { memo, type ComponentProps } from "react";
import { View, type ViewProps } from "react-native";

import { GlassCard, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

import { EditorialCard } from "./EditorialCard";
import { ProgressBar } from "./ProgressBar";

type IconName = ComponentProps<typeof Ionicons>["name"];

type HeroMetricProps = ViewProps & {
  label: string;
  meta?: string;
  unit?: string;
  value: string;
};

function HeroMetricComponent({ className, label, meta, unit, value, ...props }: HeroMetricProps) {
  return (
    <GlassCard className={cn("min-h-44 justify-between", className)} tier="floating" {...props}>
      <Typography tone="secondary" variant="labelSm">
        {label}
      </Typography>
      <View>
        <View className="flex-row items-end gap-2">
          <Typography variant="displayLg">{value}</Typography>
          {unit ? (
            <Typography className="pb-2" tone="secondary" variant="bodyMd">
              {unit}
            </Typography>
          ) : null}
        </View>
        {meta ? (
          <Typography tone="secondary" variant="labelSm">
            {meta}
          </Typography>
        ) : null}
      </View>
    </GlassCard>
  );
}

type StatCardProps = ViewProps & {
  icon?: IconName;
  label: string;
  progress?: number;
  tone?: "glass" | "solid";
  trend?: string;
  unit?: string;
  value: string;
};

function StatCardComponent({
  className,
  icon,
  label,
  progress,
  tone = "solid",
  trend,
  unit,
  value,
  ...props
}: StatCardProps) {
  const content = (
    <>
      <View className="mb-5 flex-row items-center justify-between gap-3">
        <Typography tone="secondary" variant="labelSm">
          {label}
        </Typography>
        {icon ? <Ionicons color={colors.graphiteMuted} name={icon} size={20} /> : null}
      </View>
      <View className="flex-row flex-wrap items-end gap-2">
        <Typography className="shrink" variant="headlineXl">{value}</Typography>
        {unit ? (
          <Typography className="shrink pb-1" tone="secondary" variant="bodyMd">
            {unit}
          </Typography>
        ) : null}
      </View>
      {trend ? (
        <Typography className="mt-2" tone="accent" variant="labelSm">
          {trend}
        </Typography>
      ) : null}
      {typeof progress === "number" ? (
        <ProgressBar className="mt-5" progress={progress} tone="accent" />
      ) : null}
    </>
  );

  if (tone === "glass") {
    return (
      <GlassCard className={cn("min-h-36", className)} {...props}>
        {content}
      </GlassCard>
    );
  }

  return (
    <EditorialCard className={cn("min-h-36", className)} {...props}>
      {content}
    </EditorialCard>
  );
}

type ChipProps = {
  active?: boolean;
  label: string;
};

function ChipComponent({ active, label }: ChipProps) {
  return (
    <View
      className={cn(
        "rounded-full border px-3 py-1",
        active ? "border-emerald bg-emerald-soft" : "border-border bg-transparent",
      )}
    >
      <Typography tone={active ? "accent" : "secondary"} variant="labelSm">
        {label}
      </Typography>
    </View>
  );
}

export const Chip = memo(ChipComponent);
export const HeroMetric = memo(HeroMetricComponent);
export const StatCard = memo(StatCardComponent);
