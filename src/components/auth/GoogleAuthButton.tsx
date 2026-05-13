import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";

import { AppButton } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type GoogleAuthButtonProps = {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

function GoogleAuthButtonComponent({
  disabled,
  isLoading,
  onPress,
}: GoogleAuthButtonProps) {
  return (
    <AppButton
      disabled={disabled}
      iconLeft={<Ionicons color={colors.graphite} name="logo-google" size={18} />}
      isLoading={isLoading}
      onPress={onPress}
      size="lg"
      variant="ghost"
    >
      Continue With Google
    </AppButton>
  );
}

export const GoogleAuthButton = memo(GoogleAuthButtonComponent);
