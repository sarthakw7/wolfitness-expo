import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { toCalendarIsoDate } from "@/src/lib/date";
import { colors } from "@/src/theme";
import type { SignalCalendarDayCell } from "@/src/services/signal-workout-adapter";

type SignalCalendarStripProps = {
  days: SignalCalendarDayCell[];
  monthYearLabel: string;
  onDayPress: (cell: SignalCalendarDayCell) => void;
  weekTitle: string;
};

function SignalCalendarStripComponent({
  days,
  monthYearLabel,
  onDayPress,
  weekTitle,
}: SignalCalendarStripProps) {
  return (
    <EditorialCard className="gap-2.5">
      <View className="gap-1">
        <Typography tone="secondary" variant="labelSm">
          {monthYearLabel}
        </Typography>
        <View className="flex-row items-end justify-between gap-3">
          <Typography variant="headlineLg">{weekTitle}</Typography>
          <Typography tone="secondary" variant="labelSm">
            Weekly plan
          </Typography>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-2">
          {days.map((cell) => {
            const assignedWorkout = cell.isAssigned;
            return (
              <Pressable
                accessibilityRole="button"
                className={`min-w-14 rounded-xl border px-2.5 py-2 ${
                  cell.isSelected
                    ? "border-emerald bg-emerald/8"
                    : assignedWorkout
                      ? cell.isCompleted
                        ? "border-emerald/35 bg-emerald/8"
                        : "border-border bg-background"
                      : "border-border/50 bg-background/40"
                }`}
                key={`${cell.weekKey ?? "rest"}:${cell.dayKey ?? cell.dayLabel}:${toCalendarIsoDate(cell.date)}`}
                onPress={() => onDayPress(cell)}
              >
                <View className="gap-1.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Typography tone="secondary" variant="labelSm">
                      {cell.weekdayLabel}
                    </Typography>
                    <View className="flex-row items-center gap-1">
                      {cell.isToday ? (
                        <View className="rounded-full border border-emerald/30 px-1 py-0.5">
                          <Typography tone="primary" variant="labelSm">
                            TODAY
                          </Typography>
                        </View>
                      ) : null}
                      {cell.isCompleted ? (
                        <Ionicons color={colors.emerald} name="checkmark-circle" size={16} />
                      ) : cell.isAssigned ? (
                        <View className="h-2 w-2 rounded-full bg-emerald" />
                      ) : (
                        <View className="h-1.5 w-1.5 rounded-full bg-border" />
                      )}
                    </View>
                  </View>
                  <Typography variant="bodyLg">{cell.dayLabel}</Typography>
                  <Typography numberOfLines={1} tone="secondary" variant="labelSm">
                    {cell.isAssigned ? "Planned" : "Rest"}
                  </Typography>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </EditorialCard>
  );
}

export const SignalCalendarStrip = memo(SignalCalendarStripComponent);
