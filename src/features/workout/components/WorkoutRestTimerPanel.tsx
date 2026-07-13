import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type WorkoutRestTimerPanelProps = {
  customTimerInput: string;
  onCancelCustomTimer: () => void;
  onCancelTimerPanel: () => void;
  onChangeCustomTimerInput: (next: string) => void;
  onPauseOrResumeTimer: () => void;
  onStartCustomTimer: () => void;
  onStartTimer: (seconds: number) => void;
  onTimerAdd30: () => void;
  onTimerStop: () => void;
  onTimerSubtract30: () => void;
  showCustomTimerInput: boolean;
  timerIsCompleted: boolean;
  timerIsIdle: boolean;
  timerIsPaused: boolean;
};

type TimerButtonProps = {
  children: string;
  disabled?: boolean;
  onPress: () => void;
  tone?: "default" | "secondary";
};

function isCustomTimerValid(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 5 && parsed <= 60 * 30;
}

function TimerButton({ children, disabled, onPress, tone = "default" }: TimerButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={[
        "min-h-10 items-center justify-center rounded-lg border border-white/12 px-3",
        tone === "secondary" ? "bg-transparent" : "bg-white/[0.03]",
        disabled ? "opacity-50" : "",
      ].join(" ")}
      disabled={disabled}
      onPress={onPress}
    >
      <Typography align="center" tone={tone === "secondary" ? "secondary" : "inverse"} variant="labelSm">
        {children}
      </Typography>
    </Pressable>
  );
}

export function WorkoutRestTimerPanel({
  customTimerInput,
  onCancelCustomTimer,
  onCancelTimerPanel,
  onChangeCustomTimerInput,
  onPauseOrResumeTimer,
  onStartCustomTimer,
  onStartTimer,
  onTimerAdd30,
  onTimerStop,
  onTimerSubtract30,
  showCustomTimerInput,
  timerIsCompleted,
  timerIsIdle,
  timerIsPaused,
}: WorkoutRestTimerPanelProps) {
  return (
    <View className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
      {timerIsIdle || timerIsCompleted ? (
        <View className="gap-2">
          <View className="flex-row flex-wrap gap-2">
            {[
              { label: "30 sec", seconds: 30 },
              { label: "60 sec", seconds: 60 },
              { label: "90 sec", seconds: 90 },
              { label: "2 min", seconds: 120 },
            ].map((option) => (
              <Pressable
                accessibilityRole="button"
                className="min-h-10 min-w-[72px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
                key={option.seconds}
                onPress={() => onStartTimer(option.seconds)}
              >
                <Typography align="center" tone="inverse" variant="labelSm">
                  {option.label}
                </Typography>
              </Pressable>
            ))}
            <TimerButton onPress={onCancelCustomTimer}>Custom</TimerButton>
            <TimerButton onPress={onCancelTimerPanel} tone="secondary">Cancel</TimerButton>
          </View>
          {showCustomTimerInput ? (
            <View className="gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
              <Typography tone="secondary" variant="labelSm">
                CUSTOM TIMER IN SECONDS
              </Typography>
              <TextInput
                keyboardType="number-pad"
                onChangeText={onChangeCustomTimerInput}
                placeholder="Enter seconds (5-1800)"
                placeholderTextColor="rgba(255,255,255,0.42)"
                selectionColor={colors.emerald}
                style={[styles.noteInputCompact, styles.noteInputSignal]}
                value={customTimerInput}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-center rounded-lg px-3"
                    disabled={!isCustomTimerValid(customTimerInput)}
                    onPress={onStartCustomTimer}
                    style={{
                      backgroundColor: colors.emerald,
                      borderColor: colors.emerald,
                      borderWidth: StyleSheet.hairlineWidth,
                      opacity: isCustomTimerValid(customTimerInput) ? 1 : 0.5,
                    }}
                  >
                    <Typography align="center" tone="inverse" variant="labelSm">
                      Start Custom Timer
                    </Typography>
                  </Pressable>
                </View>
                <View className="flex-[0.38]">
                  <TimerButton onPress={onCancelCustomTimer}>Cancel</TimerButton>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            className="min-h-10 min-w-[88px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
            onPress={onPauseOrResumeTimer}
          >
            <Typography align="center" tone="inverse" variant="labelSm">
              {timerIsPaused ? "Resume" : "Pause"}
            </Typography>
          </Pressable>
          <TimerButton onPress={onTimerAdd30}>+30 sec</TimerButton>
          <TimerButton onPress={onTimerSubtract30}>-30 sec</TimerButton>
          <Pressable
            accessibilityRole="button"
            className="min-h-10 min-w-[88px] items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] px-3"
            onPress={onTimerStop}
          >
            <Typography align="center" tone="inverse" variant="labelSm">
              Stop Timer
            </Typography>
          </Pressable>
          <TimerButton onPress={onCancelTimerPanel} tone="secondary">Cancel</TimerButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  noteInputCompact: {
    borderRadius: 6,
    fontSize: 14,
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteInputSignal: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.white,
  },
});
