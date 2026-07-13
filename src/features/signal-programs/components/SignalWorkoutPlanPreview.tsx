import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import {
  getSignalBlockLabel,
  getSignalExerciseLabel,
  type SignalWorkoutDayPreview,
} from "@/src/services/signal-workout-adapter";
import type {
  WorkoutProgramPayloadDay,
  WorkoutProgramPayloadExercise,
  WorkoutProgramPayloadWeek,
} from "@/src/services/programs";
import { colors } from "@/src/theme";

type CalendarCellCopy = {
  dayLabel: string;
  title: string;
  weekdayLabel: string;
} | null;

type SignalWorkoutPlanPreviewProps = {
  canOpenSelectedWorkoutSections: boolean;
  coachInstructionsText: string;
  onOpenBlock: (blockIndex: number) => void;
  onOpenCoach: () => void;
  onOpenExercise: (blockIndex: number, exerciseIndex: number) => void;
  selectedCalendarCell: CalendarCellCopy;
  selectedDay: WorkoutProgramPayloadDay | null;
  selectedDayCompleted: boolean;
  selectedPreview: SignalWorkoutDayPreview;
  selectedWeek: WorkoutProgramPayloadWeek | null;
  showUnavailableButton: boolean;
};

function getExercisePrescription(exercise: WorkoutProgramPayloadExercise) {
  const parts = [exercise.sets?.trim() ? `${exercise.sets.trim()} sets` : null];
  if (exercise.reps?.trim()) parts.push(`${exercise.reps.trim()} reps`);
  if (exercise.rpe?.trim()) parts.push(`RPE ${exercise.rpe.trim()}`);
  if (exercise.rest?.trim()) parts.push(`Rest ${exercise.rest.trim()}`);
  return parts.filter(Boolean).join(" · ");
}

function SignalWorkoutPlanPreviewComponent({
  canOpenSelectedWorkoutSections,
  coachInstructionsText,
  onOpenBlock,
  onOpenCoach,
  onOpenExercise,
  selectedCalendarCell,
  selectedDay,
  selectedDayCompleted,
  selectedPreview,
  selectedWeek,
  showUnavailableButton,
}: SignalWorkoutPlanPreviewProps) {
  if (!selectedDay || !selectedWeek) {
    return (
      <EditorialCard className="gap-3">
        <Typography variant="headlineLg">Rest Day</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {selectedCalendarCell?.title
            ? `No workout assigned for ${selectedCalendarCell.weekdayLabel} ${selectedCalendarCell.dayLabel}.`
            : "No workout assigned for this selected date."}
        </Typography>
        {showUnavailableButton ? (
          <AppButton disabled size="lg" variant="secondary">
            Unavailable
          </AppButton>
        ) : null}
      </EditorialCard>
    );
  }

  return (
    <EditorialCard className="gap-4 overflow-hidden">
      <View className="gap-1.5">
        <Typography tone="secondary" variant="labelSm">
          TODAY&apos;S TRAINING
        </Typography>
        <Typography variant="headlineLg">{selectedDay.title}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {selectedWeek.title} · {selectedDayCompleted ? "Completed" : "Ready to train"}
        </Typography>
      </View>

      <Pressable
        accessibilityRole={canOpenSelectedWorkoutSections ? "button" : undefined}
        className={cn(
          "gap-1.5 border-t border-border pt-2",
          canOpenSelectedWorkoutSections ? "rounded-lg active:bg-surface-muted" : "",
        )}
        disabled={!canOpenSelectedWorkoutSections}
        onPress={onOpenCoach}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1.5">
            <Typography tone="secondary" variant="labelSm">
              COACH INSTRUCTIONS
            </Typography>
            <Typography variant="bodyMd">{coachInstructionsText}</Typography>
          </View>
          {canOpenSelectedWorkoutSections ? (
            <View className="flex-row items-center gap-1 pt-0.5">
              <Typography tone="secondary" variant="labelSm">
                Open
              </Typography>
              <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={16} />
            </View>
          ) : null}
        </View>
      </Pressable>

      {selectedPreview.blocks.length > 0 ? (
        <View className="gap-3">
          <Typography tone="secondary" variant="labelSm">
            WORKOUT PLAN
          </Typography>
          {selectedPreview.blocks.map((block, index) => {
            const isOpenableBlock = canOpenSelectedWorkoutSections;
            const isPlayableBlock = block.isPlayable && isOpenableBlock;
            const blockLabel = getSignalBlockLabel(index);
            const hasExercises = selectedDay.blocks[index]?.exercises.length > 0;
            const blockExercises = selectedDay.blocks[index]?.exercises ?? [];
            return (
              <View className="flex-row items-start gap-3" key={block.key}>
                <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald">
                  <Typography className="text-white" variant="labelMd">
                    {blockLabel}
                  </Typography>
                </View>
                <View className="flex-1 gap-1.5 border-b border-border pb-3">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-0.5">
                      <Typography variant="bodyLg">{block.title}</Typography>
                      <Typography tone="secondary" variant="labelSm">
                        {block.isInstructionOnly ? "Instruction block" : block.isMixed ? "Mixed block" : "Exercise block"}
                      </Typography>
                    </View>
                    <Typography tone={selectedDayCompleted ? "accent" : "secondary"} variant="labelSm">
                      {selectedDayCompleted ? "Completed" : hasExercises ? "Ready" : "Instructions"}
                    </Typography>
                  </View>

                  {block.instruction ? (
                    <Typography tone="secondary" variant="bodyMd">
                      {block.instruction}
                    </Typography>
                  ) : null}

                  {hasExercises ? (
                    <View className="gap-1 pt-0.5">
                      {blockExercises.map((exercise, exerciseIndex) => {
                        const exerciseLabel = getSignalExerciseLabel(blockLabel, exerciseIndex);
                        const prescription = getExercisePrescription(exercise);
                        return (
                          <Pressable
                            accessibilityRole="button"
                            className={`flex-row items-start gap-3 rounded-lg px-1 py-1.5 ${
                              isPlayableBlock ? "active:bg-surface-muted" : ""
                            }`}
                            key={exercise.sync_key}
                            onPress={() => {
                              if (!isPlayableBlock) return;
                              onOpenExercise(index, exerciseIndex);
                            }}
                          >
                            <View className="mt-0.5 min-w-10 items-center rounded-full bg-emerald/10 px-2 py-1">
                              <Typography tone="primary" variant="labelSm">
                                {exerciseLabel}
                              </Typography>
                            </View>
                            <View className="flex-1 gap-0.5">
                              <Typography variant="bodyMd">{exercise.exerciseName}</Typography>
                              {prescription ? (
                                <Typography tone="secondary" variant="labelSm">
                                  {prescription}
                                </Typography>
                              ) : null}
                              {exercise.notes?.trim() ? (
                                <Typography numberOfLines={2} tone="secondary" variant="labelSm">
                                  {exercise.notes.trim()}
                                </Typography>
                              ) : null}
                            </View>
                            {isPlayableBlock ? (
                              <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={16} />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : block.prescriptionSummary ? (
                    <Typography tone="secondary" variant="labelSm">
                      {block.prescriptionSummary}
                    </Typography>
                  ) : null}

                  {!hasExercises && block.isInstructionOnly && !block.instruction ? (
                    <Typography tone="secondary" variant="bodyMd">
                      This block contains coach instructions only.
                    </Typography>
                  ) : null}

                  {isOpenableBlock ? (
                    <Pressable
                      accessibilityRole="button"
                      className="flex-row items-center gap-2 pt-1"
                      onPress={() => onOpenBlock(index)}
                    >
                      <Typography tone="primary" variant="labelSm">
                        {hasExercises ? "Open block" : "Open step"}
                      </Typography>
                      <Ionicons color={colors.emerald} name="arrow-forward" size={14} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!selectedPreview.blocks.length ? (
        <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
          <Typography variant="headlineLg">Workout preview unavailable</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This day does not have any block details yet.
          </Typography>
        </View>
      ) : null}

      {!selectedPreview.isPlayable ? (
        <View className="gap-2 rounded-2xl border border-border bg-surface-muted p-4">
          <Typography variant="headlineLg">Rest day</Typography>
          <Typography tone="secondary" variant="bodyMd">
            This selected day does not contain playable exercises.
          </Typography>
        </View>
      ) : null}
    </EditorialCard>
  );
}

export const SignalWorkoutPlanPreview = memo(SignalWorkoutPlanPreviewComponent);
