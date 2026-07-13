import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type SignalWorkoutHeaderProps = {
  currentStepTitle: string;
  hasStartedSession: boolean;
  isSavingAndExiting: boolean;
  onClose: () => void;
  onFinishEarly: (() => void) | null;
  onNext: () => void;
  paddingTop: number;
  stepCount: number;
  stepIndex: number;
};

export function SignalWorkoutHeader({
  currentStepTitle,
  hasStartedSession,
  isSavingAndExiting,
  onClose,
  onFinishEarly,
  onNext,
  paddingTop,
  stepCount,
  stepIndex,
}: SignalWorkoutHeaderProps) {
  return (
    <View
      className="absolute inset-x-0 z-20 border-b border-white/10 bg-[#0f1316]"
      style={[styles.signalHeaderWrap, { paddingTop }]}
    >
      <View className="px-container pb-3">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Close workout"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/[0.04]"
            disabled={isSavingAndExiting}
            hitSlop={8}
            onPress={onClose}
          >
            <Ionicons color={colors.white} name="close" size={18} />
          </Pressable>
          <View className="flex-1 px-4">
            <View className="flex-row items-center justify-center gap-1.5">
              <Typography align="center" className="tracking-[1px] opacity-70" tone="inverse" variant="labelSm">
                STEP {Math.min(stepIndex + 1, Math.max(1, stepCount))} OF {Math.max(1, stepCount)}
              </Typography>
              {hasStartedSession ? (
                <View className="rounded bg-emerald/20 px-1 py-0.5">
                  <Typography className="text-[9px] tracking-[1px] text-emerald" variant="labelSm" style={{ fontSize: 9, lineHeight: 11 }}>
                    LIVE
                  </Typography>
                </View>
              ) : null}
            </View>
            <Typography align="center" numberOfLines={1} tone="inverse" variant="bodyLg">
              {currentStepTitle}
            </Typography>
          </View>
          <View className="flex-row items-center gap-2">
            {onFinishEarly ? (
              <Pressable
                accessibilityLabel="Finish early"
                accessibilityRole="button"
                className="h-10 items-center justify-center px-2"
                hitSlop={8}
                onPress={onFinishEarly}
              >
                <Typography className="opacity-70" tone="inverse" variant="labelSm">
                  Finish
                </Typography>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityLabel="Next step"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/[0.04]"
              hitSlop={8}
              onPress={onNext}
            >
              <Ionicons color={colors.white} name="arrow-forward" size={18} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signalHeaderWrap: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
});
