import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

type ActiveWorkoutBannerState =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "error" }
  | {
      body: string;
      ctaLabel: string | null;
      kind: "recovery";
      title: string;
    }
  | {
      body: string;
      kind: "ready";
      label: string;
      subtitle: string;
      title: string;
    };

type ActiveWorkoutBannerProps = {
  onOpenProgram: (() => void) | null;
  onResume: () => void;
  onRetry: () => void;
  state: ActiveWorkoutBannerState;
};

export function ActiveWorkoutBanner({
  onOpenProgram,
  onResume,
  onRetry,
  state,
}: ActiveWorkoutBannerProps) {
  if (state.kind === "hidden") return null;

  if (state.kind === "loading") {
    return <EditorialCard className="min-h-28 bg-surface-muted" />;
  }

  if (state.kind === "error") {
    return (
      <EditorialCard className="gap-3">
        <Typography variant="headlineLg">Unable to recover workout</Typography>
        <Typography tone="secondary" variant="bodyMd">
          We could not load your in-progress workout state.
        </Typography>
        <AppButton onPress={onRetry} variant="secondary">
          Retry
        </AppButton>
      </EditorialCard>
    );
  }

  if (state.kind === "recovery") {
    return (
      <EditorialCard className="gap-3">
        <Typography tone="secondary" variant="labelSm">
          WORKOUT RECOVERY
        </Typography>
        <Typography variant="headlineLg">{state.title}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {state.body}
        </Typography>
        {state.ctaLabel && onOpenProgram ? (
          <AppButton onPress={onOpenProgram} variant="secondary">
            {state.ctaLabel}
          </AppButton>
        ) : null}
      </EditorialCard>
    );
  }

  return (
    <EditorialCard className="gap-4">
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          WORKOUT IN PROGRESS
        </Typography>
        <Typography variant="headlineLg">{state.subtitle}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {state.body}
        </Typography>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Typography tone="secondary" variant="labelSm">
          Source {state.label}
        </Typography>
      </View>

      <AppButton onPress={onResume}>Resume Workout</AppButton>
    </EditorialCard>
  );
}
