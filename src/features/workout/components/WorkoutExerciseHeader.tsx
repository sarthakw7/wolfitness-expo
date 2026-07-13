import { View } from "react-native";

import { Typography } from "@/src/components/primitives";

type WorkoutExerciseHeaderProps = {
  exerciseName: string;
  notes: string;
  primaryMuscle: string;
};

export function WorkoutExerciseHeader({
  exerciseName,
  notes,
  primaryMuscle,
}: WorkoutExerciseHeaderProps) {
  return (
    <View className="gap-gutter">
      <View className="gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Typography tone="secondary" variant="labelSm">
              {primaryMuscle}
            </Typography>
            <Typography tone="inverse" variant="headlineXl">{exerciseName}</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {notes}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
}
