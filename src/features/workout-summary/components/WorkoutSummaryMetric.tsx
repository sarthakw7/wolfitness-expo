import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";

type WorkoutSummaryMetricProps = {
  accent?: boolean;
  helper?: string | null;
  label: string;
  value: string;
};

function WorkoutSummaryMetricComponent({ accent = false, helper, label, value }: WorkoutSummaryMetricProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border p-4",
        accent ? "border-emerald/20 bg-emerald/10" : "border-border bg-surface-muted",
      )}
      style={{ width: "48%" }}
    >
      <Typography tone="secondary" variant="labelSm">
        {label}
      </Typography>
      <Typography className="mt-1" variant="headlineLg">
        {value}
      </Typography>
      {helper ? (
        <Typography className="mt-1" tone="secondary" variant="labelSm">
          {helper}
        </Typography>
      ) : null}
    </View>
  );
}

export const WorkoutSummaryMetric = memo(WorkoutSummaryMetricComponent);
