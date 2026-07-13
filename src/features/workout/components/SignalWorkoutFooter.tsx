import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { WorkoutRestTimerPanel } from "@/src/features/workout/components/WorkoutRestTimerPanel";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

type SignalFooterButtonProps = {
  children: string;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

type SignalWorkoutFooterProps = {
  canGoBack: boolean;
  centerActionLabel: string;
  customTimerInput: string;
  finishPending: boolean;
  hasStartedSession: boolean;
  isDoneTrainingStep: boolean;
  isReflectionStep: boolean;
  isSummaryStep: boolean;
  isWorkoutProgressStep: boolean;
  onBack: () => void;
  onCancelCustomTimer: () => void;
  onCancelTimerPanel: () => void;
  onCenterAction: () => void;
  onChangeCustomTimerInput: (next: string) => void;
  onFinishSession: () => void;
  onPauseOrResumeTimer: () => void;
  onPrimaryAction: () => void;
  onStartCustomTimer: () => void;
  onStartTimer: (seconds: number) => void;
  onStepDone: () => void;
  onTimerAdd30: () => void;
  onTimerSubtract30: () => void;
  onTimerStop: () => void;
  rightActionLabel: string;
  showCustomTimerInput: boolean;
  showRestTimerOptions: boolean;
  startSessionPending: boolean;
  timerIsCompleted: boolean;
  timerIsIdle: boolean;
  timerIsPaused: boolean;
};

function SignalFooterSecondaryButton({ children, disabled, onPress }: SignalFooterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "min-h-12 flex-row items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3",
        disabled ? "opacity-45" : "active:bg-white/[0.06]",
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Typography align="center" tone="inverse" variant="labelSm">
        {children}
      </Typography>
    </Pressable>
  );
}

function SignalFooterPrimaryButton({ children, disabled, isLoading, onPress }: SignalFooterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "min-h-12 flex-row items-center justify-center rounded-lg px-3",
        disabled || isLoading ? "opacity-50" : "active:opacity-90",
      )}
      disabled={disabled || isLoading}
      onPress={onPress}
      style={{
        backgroundColor: colors.emerald,
        borderColor: colors.emerald,
        borderWidth: StyleSheet.hairlineWidth,
      }}
    >
      {isLoading ? <ActivityIndicator color={colors.white} /> : null}
      <Typography align="center" tone="inverse" variant="labelSm">
        {children}
      </Typography>
    </Pressable>
  );
}

function SignalFooterTimerButton({ children, onPress }: SignalFooterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg border border-emerald/35 bg-emerald/10 px-4 active:bg-emerald/15"
      onPress={onPress}
    >
      <Ionicons color={colors.white} name="timer-outline" size={16} />
      <Typography align="center" tone="inverse" variant="labelMd">
        {children}
      </Typography>
    </Pressable>
  );
}

export function SignalWorkoutFooter({
  canGoBack,
  centerActionLabel,
  customTimerInput,
  finishPending,
  hasStartedSession,
  isDoneTrainingStep,
  isReflectionStep,
  isSummaryStep,
  isWorkoutProgressStep,
  onBack,
  onCancelCustomTimer,
  onCancelTimerPanel,
  onCenterAction,
  onChangeCustomTimerInput,
  onFinishSession,
  onPauseOrResumeTimer,
  onPrimaryAction,
  onStartCustomTimer,
  onStartTimer,
  onStepDone,
  onTimerAdd30,
  onTimerStop,
  onTimerSubtract30,
  rightActionLabel,
  showCustomTimerInput,
  showRestTimerOptions,
  startSessionPending,
  timerIsCompleted,
  timerIsIdle,
  timerIsPaused,
}: SignalWorkoutFooterProps) {
  if (isSummaryStep) {
    return (
      <SignalFooterPrimaryButton isLoading={finishPending} onPress={onStepDone}>
        Done
      </SignalFooterPrimaryButton>
    );
  }

  if (isReflectionStep) {
    return (
      <View className="flex-row gap-3">
        <View className="flex-[0.42]">
          <SignalFooterSecondaryButton disabled={finishPending} onPress={onBack}>
            Back
          </SignalFooterSecondaryButton>
        </View>
        <View className="flex-1">
          <SignalFooterPrimaryButton isLoading={finishPending} onPress={onFinishSession}>
            Finish Session
          </SignalFooterPrimaryButton>
        </View>
      </View>
    );
  }

  if (isDoneTrainingStep) {
    return (
      <View className="flex-row gap-3">
        <View className="flex-[0.52]">
          <SignalFooterSecondaryButton disabled={!canGoBack} onPress={onBack}>
            Back to Training
          </SignalFooterSecondaryButton>
        </View>
        <View className="flex-1">
          <SignalFooterPrimaryButton onPress={onPrimaryAction}>
            Continue
          </SignalFooterPrimaryButton>
        </View>
      </View>
    );
  }

  if (!isWorkoutProgressStep) {
    return <View />;
  }

  return (
    <View className="gap-3">
      {showRestTimerOptions && hasStartedSession ? (
        <WorkoutRestTimerPanel
          customTimerInput={customTimerInput}
          onCancelCustomTimer={onCancelCustomTimer}
          onCancelTimerPanel={onCancelTimerPanel}
          onChangeCustomTimerInput={onChangeCustomTimerInput}
          onPauseOrResumeTimer={onPauseOrResumeTimer}
          onStartCustomTimer={onStartCustomTimer}
          onStartTimer={onStartTimer}
          onTimerAdd30={onTimerAdd30}
          onTimerStop={onTimerStop}
          onTimerSubtract30={onTimerSubtract30}
          showCustomTimerInput={showCustomTimerInput}
          timerIsCompleted={timerIsCompleted}
          timerIsIdle={timerIsIdle}
          timerIsPaused={timerIsPaused}
        />
      ) : null}
      <View className="flex-row items-center gap-3">
        <View className="flex-[0.3]">
          <SignalFooterSecondaryButton disabled={!canGoBack} onPress={onBack}>
            Back
          </SignalFooterSecondaryButton>
        </View>
        <View className="flex-[0.4]">
          {!hasStartedSession ? (
            <SignalFooterPrimaryButton isLoading={startSessionPending} onPress={onCenterAction}>
              {centerActionLabel}
            </SignalFooterPrimaryButton>
          ) : (
            <SignalFooterTimerButton onPress={onCenterAction}>
              {centerActionLabel}
            </SignalFooterTimerButton>
          )}
        </View>
        <View className="flex-[0.3]">
          <SignalFooterSecondaryButton disabled={false} onPress={onPrimaryAction}>
            {rightActionLabel}
          </SignalFooterSecondaryButton>
        </View>
      </View>
    </View>
  );
}
