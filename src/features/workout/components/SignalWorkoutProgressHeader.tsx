import { View } from "react-native";

import { ProgressBar } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";

type SignalWorkoutProgressHeaderProps = {
  progress: number;
  progressIndex: number;
  steps: { id: string }[];
  stepLabel: string;
  summaryLabel: string;
};

export function SignalWorkoutProgressHeader({
  progress,
  progressIndex,
  steps,
  stepLabel,
  summaryLabel,
}: SignalWorkoutProgressHeaderProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        {steps.map((step, index) => {
          const isCurrent = index === progressIndex;
          const isCompleted = index < progressIndex;
          return (
            <View
              key={step.id}
              className={cn(
                "h-2 rounded-full",
                isCurrent ? "w-8 bg-emerald" : isCompleted ? "w-2 bg-emerald/80" : "w-2 bg-white/20",
              )}
            />
          );
        })}
      </View>

      <View className="flex-row items-center justify-between">
        <Typography className="tracking-[1px] opacity-75" tone="inverse" variant="labelSm">
          {stepLabel}
        </Typography>
        <Typography className="opacity-90" tone="inverse" variant="labelSm">
          {summaryLabel}
        </Typography>
      </View>
      <ProgressBar className="h-1.5" progress={progress} tone="accent" />
    </View>
  );
}
