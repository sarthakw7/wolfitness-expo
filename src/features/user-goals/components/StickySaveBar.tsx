import { memo } from "react";
import { View } from "react-native";

import { AppButton } from "@/src/components/primitives";

type StickySaveBarProps = {
  disabled?: boolean;
  isSaving?: boolean;
  onSave: () => void;
};

function StickySaveBarComponent({ disabled, isSaving, onSave }: StickySaveBarProps) {
  return (
    <View className="gap-3">
      <AppButton
        className="w-full rounded-full bg-emerald border-emerald"
        disabled={disabled}
        isLoading={isSaving}
        onPress={onSave}
        size="lg"
        style={{ backgroundColor: "#0F9D58", borderColor: "#0F9D58" }}
        variant="primary"
      >
        Save Goal Profile
      </AppButton>
    </View>
  );
}

export const StickySaveBar = memo(StickySaveBarComponent);
