import { View } from "react-native";

import { AppButton } from "@/src/components/primitives";
import { SIGNAL_LIFECYCLE_ACTION_COPY } from "../constants";

type ActiveProgramActionsProps = {
  isResetting?: boolean;
  isUnjoining?: boolean;
  onReset: () => void;
  onUnjoin: () => void;
};

export function ActiveProgramActions({
  isResetting = false,
  isUnjoining = false,
  onReset,
  onUnjoin,
}: ActiveProgramActionsProps) {
  return (
    <View className="gap-3">
      <AppButton
        className="w-full"
        disabled={isResetting || isUnjoining}
        isLoading={isResetting}
        onPress={onReset}
        size="lg"
        variant="ghost"
      >
        {isResetting ? SIGNAL_LIFECYCLE_ACTION_COPY.reset.pendingLabel : SIGNAL_LIFECYCLE_ACTION_COPY.reset.label}
      </AppButton>
      <AppButton
        className="w-full"
        disabled={isResetting || isUnjoining}
        isLoading={isUnjoining}
        onPress={onUnjoin}
        size="lg"
        variant="danger"
      >
        {isUnjoining ? SIGNAL_LIFECYCLE_ACTION_COPY.unjoin.pendingLabel : SIGNAL_LIFECYCLE_ACTION_COPY.unjoin.label}
      </AppButton>
    </View>
  );
}
