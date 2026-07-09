import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors, radius } from "@/src/theme";

import { SIGNAL_LIFECYCLE_ACTION_COPY } from "../constants";

type SignalSessionActionType = "start" | "resume" | "summary";

type SignalSessionPrimaryActionProps = {
  actionType: SignalSessionActionType;
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

function getSessionActionCopy(actionType: SignalSessionActionType) {
  switch (actionType) {
    case "summary":
      return {
        label: SIGNAL_LIFECYCLE_ACTION_COPY.summary.label,
        pendingLabel: SIGNAL_LIFECYCLE_ACTION_COPY.summary.pendingLabel,
      };
    case "resume":
      return {
        label: SIGNAL_LIFECYCLE_ACTION_COPY.session.resumeLabel,
        pendingLabel: SIGNAL_LIFECYCLE_ACTION_COPY.session.resumePendingLabel,
      };
    case "start":
    default:
      return {
        label: SIGNAL_LIFECYCLE_ACTION_COPY.session.readyLabel,
        pendingLabel: SIGNAL_LIFECYCLE_ACTION_COPY.session.startPendingLabel,
      };
  }
}

function SignalSessionPrimaryActionComponent({
  actionType,
  disabled = false,
  isLoading = false,
  onPress,
}: SignalSessionPrimaryActionProps) {
  const { label, pendingLabel } = getSessionActionCopy(actionType);
  const isDisabled = disabled || isLoading;

  return (
    <View className="w-full">
      <Pressable
        accessibilityRole="button"
        className={cn("w-full items-center justify-center rounded-2xl px-4", isDisabled ? "opacity-60" : "active:opacity-90")}
        disabled={isDisabled}
        onPress={onPress}
        style={[
          styles.button,
          isDisabled ? styles.disabled : null,
        ]}
      >
        {isLoading ? <ActivityIndicator color={colors.white} /> : null}
        <Typography align="center" tone="inverse" variant="labelMd">
          {isLoading ? pendingLabel : label}
        </Typography>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#0F9D58",
    borderColor: "#0F9D58",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.48,
  },
});

export const SignalSessionPrimaryAction = memo(SignalSessionPrimaryActionComponent);
