import { memo } from "react";
import { Pressable, View, type ViewStyle } from "react-native";

import { Typography } from "@/src/components/primitives";

type Props = {
  label?: string;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export const OnboardingContinueButton = memo(function OnboardingContinueButton({
  disabled,
  label = "Continue",
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      className={
        disabled
          ? "w-full rounded-lg border border-[#353434] bg-transparent py-4"
          : "w-full rounded-lg bg-[#e5e2e1] py-4"
      }
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { opacity: 0.92 } : null,
      ]}
    >
      <View className="items-center justify-center">
        <Typography
          className={disabled ? "tracking-[3px] text-[#C4C7C7]" : "tracking-[3px] text-[#141313]"}
          style={{ textTransform: "uppercase" }}
          variant="labelSm"
        >
          {label}
        </Typography>
      </View>
    </Pressable>
  );
});

