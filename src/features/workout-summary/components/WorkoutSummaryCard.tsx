import { memo } from "react";
import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";

import { formatAverageRpe, formatDurationMinutes, formatReps, formatSummaryLine, formatVolumeKg } from "../lib/formatWorkoutSummary";
import type { WorkoutSummary } from "../types";
import { WorkoutSummaryMetric } from "./WorkoutSummaryMetric";

type WorkoutSummaryCardProps = {
  summary: WorkoutSummary;
};

function WorkoutSummaryCardComponent({ summary }: WorkoutSummaryCardProps) {
  const averageRpeLabel = formatAverageRpe(summary.averageRpe);

  return (
    <EditorialCard className="gap-4">
      <View className="gap-1">
        <Typography tone="secondary" variant="labelSm">
          WORKOUT SUMMARY
        </Typography>
        <Typography variant="headlineXl">Workout Summary</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {formatSummaryLine(summary)}
        </Typography>
      </View>

      <View className="flex-row flex-wrap justify-between gap-3">
        <WorkoutSummaryMetric label="Exercises" value={`${summary.totalExercises}`} />
        <WorkoutSummaryMetric label="Sets" value={`${summary.totalSets}`} />
        <WorkoutSummaryMetric label="Reps" value={formatReps(summary.totalReps)} />
        <WorkoutSummaryMetric accent label="Volume" value={formatVolumeKg(summary.totalVolumeKg)} helper="Total volume moved" />
        <WorkoutSummaryMetric accent label="Weight moved" value={formatVolumeKg(summary.totalWeightMovedKg)} helper="Same as volume for MVP" />
        <WorkoutSummaryMetric label="Duration" value={formatDurationMinutes(summary.durationMinutes)} />
        {averageRpeLabel ? <WorkoutSummaryMetric label="Average RPE" value={averageRpeLabel} /> : null}
      </View>

      {summary.notes ? (
        <View className="rounded-2xl border border-border bg-surface-muted p-4">
          <Typography tone="secondary" variant="labelSm">
            Notes
          </Typography>
          <Typography className="mt-1" variant="bodyMd">
            {summary.notes}
          </Typography>
        </View>
      ) : null}
    </EditorialCard>
  );
}

export const WorkoutSummaryCard = memo(WorkoutSummaryCardComponent);
