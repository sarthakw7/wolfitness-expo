import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { EditorialCard, ProgressBar } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { WorkoutSummaryCard } from "@/src/features/workout-summary/components/WorkoutSummaryCard";
import type { WorkoutSummary } from "@/src/features/workout-summary/types";
import { colors } from "@/src/theme";

type CompletionNextWorkout = {
  dayLabel: string;
  weekLabel: string;
} | null;

type WorkoutCompletionSummaryProps = {
  completedDayTitle: string;
  completedWeekLabel: string;
  isProgramCompleted: boolean;
  nextWorkout: CompletionNextWorkout;
  onBackToDashboard: () => void;
  onViewNextWorkout: (() => void) | null;
  progressUpdateNeedsRefresh: boolean;
  programTitle: string;
  signalMode?: boolean;
  summary: WorkoutSummary;
};

export function WorkoutCompletionSummary({
  completedDayTitle,
  completedWeekLabel,
  isProgramCompleted,
  nextWorkout,
  onBackToDashboard,
  onViewNextWorkout,
  progressUpdateNeedsRefresh,
  programTitle,
  signalMode,
  summary,
}: WorkoutCompletionSummaryProps) {
  if (signalMode) {
    return (
      <View className="gap-4">
        <View className="items-center gap-3 rounded-[32px] border border-white/10 bg-[#101417] px-5 py-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
            <Ionicons color={colors.emerald} name="checkmark-circle" size={34} />
          </View>
          <Typography tone="secondary" variant="labelSm">
            Workout Complete
          </Typography>
          <Typography align="center" tone="inverse" variant="headlineXl">
            {programTitle}
          </Typography>
          <Typography align="center" className="opacity-80" tone="inverse" variant="bodyMd">
            {completedWeekLabel} · {completedDayTitle}
          </Typography>
        </View>

        <WorkoutSummaryCard summary={summary} />

        {progressUpdateNeedsRefresh ? (
          <Typography className="opacity-85" tone="inverse" variant="bodyMd">
            Workout saved, but progress update needs refresh.
          </Typography>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <EditorialCard className="gap-5 py-5">
        <View className="items-center gap-2">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
            <Ionicons color={colors.emerald} name="checkmark-circle" size={34} />
          </View>
          <Typography tone="secondary" variant="labelSm">
            Workout Complete
          </Typography>
          <Typography variant="headlineXl">{programTitle}</Typography>
        </View>

        <ProgressBar progress={1} tone="accent" className="h-2" />

        <View className="gap-2 rounded-2xl bg-surface-muted p-4">
          <Typography variant="headlineLg">{completedWeekLabel}</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {completedDayTitle}
          </Typography>
        </View>
      </EditorialCard>

      <WorkoutSummaryCard summary={summary} />

      <EditorialCard className="gap-3">
        <View className="gap-2">
          <Typography tone="secondary" variant="labelSm">
            {progressUpdateNeedsRefresh
              ? "Workout saved, but progress update needs refresh"
              : isProgramCompleted
                ? "Program completed"
                : "Next workout"}
          </Typography>
          <Typography variant="bodyMd">
            {progressUpdateNeedsRefresh
              ? "Please return to the dashboard to refresh your active program state."
              : isProgramCompleted
                ? "You completed every playable workout in this program."
                : nextWorkout
                  ? `${nextWorkout.weekLabel} · ${nextWorkout.dayLabel}`
                  : "Next workout unavailable."}
          </Typography>
        </View>

        <View className="gap-3 pt-2">
          {nextWorkout && !progressUpdateNeedsRefresh && !isProgramCompleted && onViewNextWorkout ? (
            <AppButton onPress={onViewNextWorkout}>
              View Next Workout
            </AppButton>
          ) : null}
          <AppButton
            onPress={onBackToDashboard}
            variant={nextWorkout && !progressUpdateNeedsRefresh && !isProgramCompleted ? "secondary" : "primary"}
          >
            Back to Dashboard
          </AppButton>
        </View>
      </EditorialCard>
    </View>
  );
}
