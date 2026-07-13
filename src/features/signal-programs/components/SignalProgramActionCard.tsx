import { memo } from "react";
import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { ActiveProgramActions } from "@/src/features/program-lifecycle/components/ActiveProgramActions";

type SignalProgramActionCardProps = {
  isResetting: boolean;
  isUnjoining: boolean;
  onReset: () => void;
  onUnjoin: () => void;
};

function SignalProgramActionCardComponent({
  isResetting,
  isUnjoining,
  onReset,
  onUnjoin,
}: SignalProgramActionCardProps) {
  return (
    <EditorialCard className="gap-3">
      <View className="gap-1">
        <Typography tone="secondary" variant="labelSm">
          PROGRAM ACTIONS
        </Typography>
        <Typography tone="secondary" variant="bodyMd">
          Keep your current history, or restart the program from Week 1 Day 1.
        </Typography>
      </View>
      <ActiveProgramActions
        isResetting={isResetting}
        isUnjoining={isUnjoining}
        onReset={onReset}
        onUnjoin={onUnjoin}
      />
    </EditorialCard>
  );
}

export const SignalProgramActionCard = memo(SignalProgramActionCardComponent);
