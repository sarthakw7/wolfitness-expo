import { memo } from "react";
import { Pressable, View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { SignalSessionPrimaryAction } from "@/src/features/program-lifecycle/components/SignalSessionPrimaryAction";

type SignalSessionActionType = "start" | "resume" | "summary";

type SignalTrainingCardProps = {
  actionType: SignalSessionActionType;
  blockCount: number;
  dayTitle: string;
  exerciseCount: number;
  hasUpdateToLatest: boolean;
  isPlayableDay: boolean;
  isUpdateVersionPending: boolean;
  onPrimaryAction: () => void;
  onUpdateToLatest: () => void;
  programTitle: string;
  statusLabel: string;
  updateBannerButtonDisabled: boolean;
  weekTitle: string;
};

function SignalTrainingCardComponent({
  actionType,
  blockCount,
  dayTitle,
  exerciseCount,
  hasUpdateToLatest,
  isPlayableDay,
  isUpdateVersionPending,
  onPrimaryAction,
  onUpdateToLatest,
  programTitle,
  statusLabel,
  updateBannerButtonDisabled,
  weekTitle,
}: SignalTrainingCardProps) {
  return (
    <EditorialCard className="gap-2.5">
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-3">
          <Typography tone="secondary" variant="labelSm">
            TRAINING
          </Typography>
        </View>
        <Typography variant="headlineLg">{programTitle}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {weekTitle} · {dayTitle}
        </Typography>
        <View className="flex-row items-center gap-3 border-t border-border pt-2.5">
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              Status
            </Typography>
            <Typography variant="bodyMd">{statusLabel}</Typography>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              Blocks
            </Typography>
            <Typography variant="bodyMd">{blockCount}</Typography>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              Exercises
            </Typography>
            <Typography variant="bodyMd">{exerciseCount}</Typography>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="flex-1 gap-1">
            <Typography tone="secondary" variant="labelSm">
              Minutes
            </Typography>
            <Typography variant="bodyMd">--</Typography>
          </View>
        </View>
        <View className="gap-3 pt-4">
          <SignalSessionPrimaryAction
            actionType={actionType}
            disabled={!isPlayableDay}
            isLoading={false}
            onPress={onPrimaryAction}
          />
        </View>
        {hasUpdateToLatest ? (
          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-emerald/25 bg-emerald/8 px-3 py-3">
            <View className="flex-1 gap-0.5">
              <Typography tone="primary" variant="labelSm">
                Update available
              </Typography>
              <Typography tone="secondary" variant="labelSm">
                Coach published a newer version.
              </Typography>
            </View>
            <Pressable
              accessibilityRole="button"
              className={cn(
                "min-h-10 min-w-[88px] items-center justify-center rounded-full px-4",
                updateBannerButtonDisabled ? "bg-emerald/30 opacity-60" : "bg-emerald active:opacity-85",
              )}
              disabled={updateBannerButtonDisabled}
              onPress={onUpdateToLatest}
            >
              <Typography tone="inverse" variant="labelSm">
                {isUpdateVersionPending ? "Updating..." : "Update"}
              </Typography>
            </Pressable>
          </View>
        ) : null}
      </View>
    </EditorialCard>
  );
}

export const SignalTrainingCard = memo(SignalTrainingCardComponent);
