import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

type SignalProgramDashboardCardState =
  | { kind: "hidden" }
  | { kind: "loading" }
  | {
      body: string;
      ctaLabel?: string;
      kind: "program_unavailable" | "active_pointer_invalid";
      title: string;
    }
  | {
      completedWorkouts: number;
      currentDayLabel: string;
      currentWeekLabel: string;
      hasOpenSession: boolean;
      isProgramCompleted: boolean;
      kind: "ready";
      nextWorkoutPreview: {
        dayLabel: string;
        weekLabel: string;
      } | null;
      percentage: number;
      programTitle: string;
      totalWorkouts: number;
    };

type SignalProgramDashboardCardProps = {
  onBrowsePrograms: () => void;
  onContinue: (() => void) | null;
  state: SignalProgramDashboardCardState;
};

export function SignalProgramDashboardCard({
  onBrowsePrograms,
  onContinue,
  state,
}: SignalProgramDashboardCardProps) {
  if (state.kind === "hidden") return null;

  if (state.kind === "loading") {
    return <EditorialCard className="min-h-36 bg-surface-muted" />;
  }

  if (state.kind === "program_unavailable" || state.kind === "active_pointer_invalid") {
    return (
      <EditorialCard className="gap-3">
        <Typography tone="secondary" variant="labelSm">
          ACTIVE SIGNAL PROGRAM
        </Typography>
        <Typography variant="headlineLg">{state.title}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {state.body}
        </Typography>
        <View className="pt-2">
          <AppButton onPress={onBrowsePrograms} variant="secondary">
            {state.ctaLabel}
          </AppButton>
        </View>
      </EditorialCard>
    );
  }

  if (state.kind !== "ready") return null;

  return (
    <EditorialCard className="gap-4">
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          CURRENT PROGRAM
        </Typography>
        <Typography variant="headlineXl">{state.programTitle}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {state.isProgramCompleted
            ? "Program completed."
            : "Continue from your saved week and day."}
        </Typography>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Typography tone="secondary" variant="labelSm">
          {state.currentWeekLabel}
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          {state.currentDayLabel}
        </Typography>
      </View>

      <View className="gap-2">
        <View className="flex-row items-end justify-between gap-4">
          <Typography variant="headlineLg">
            {state.completedWorkouts} of {state.totalWorkouts} workouts complete
          </Typography>
          <Typography tone="secondary" variant="headlineLg">
            {state.percentage}%
          </Typography>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <View className="h-full rounded-full bg-emerald" style={{ width: `${state.percentage}%` }} />
        </View>
      </View>

      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          {state.isProgramCompleted ? "Program completed" : "Next workout"}
        </Typography>
        <Typography variant="bodyMd">
          {state.nextWorkoutPreview
            ? `${state.nextWorkoutPreview.weekLabel} · ${state.nextWorkoutPreview.dayLabel}`
            : "Program completed"}
        </Typography>
      </View>

      <View className="gap-3 pt-2">
        {!state.isProgramCompleted && onContinue ? (
          <AppButton onPress={onContinue}>Go to Workout</AppButton>
        ) : null}

        {state.isProgramCompleted ? (
          <AppButton onPress={onBrowsePrograms} variant="secondary">
            Browse Programs
          </AppButton>
        ) : null}
      </View>
    </EditorialCard>
  );
}
