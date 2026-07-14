import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type DashboardMetricCardsProps = {
  dailyCalorieTarget: number | null | undefined;
  hasNutritionData: boolean;
  macroProgress: {
    calories: {
      progress: number;
      value: string;
    };
  };
  onLogFirstMeal: () => void;
  weeklyDots: {
    completed: boolean;
    isFuture: boolean;
    isToday: boolean;
    label: string;
  }[];
};

export function DashboardMetricCards({
  dailyCalorieTarget,
  hasNutritionData,
  macroProgress,
  onLogFirstMeal,
  weeklyDots,
}: DashboardMetricCardsProps) {
  return (
    <View className="gap-gutter">
      <EditorialCard className="gap-5">
        <View className="flex-row items-center justify-between">
          <Typography tone="secondary" variant="labelSm">ENERGY EXPENDITURE</Typography>
          <Ionicons color={colors.graphiteMuted} name="flame-outline" size={20} />
        </View>
        <View className="flex-row items-end gap-2">
          <Typography variant="displayLg">{macroProgress.calories.value}</Typography>
          <Typography tone="secondary" variant="bodyLg">kcal</Typography>
        </View>
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Typography tone="secondary" variant="labelSm">Daily Goal</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {dailyCalorieTarget?.toLocaleString() ?? "--"} kcal
            </Typography>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <View className="h-full rounded-full bg-emerald" style={{ width: `${macroProgress.calories.progress * 100}%` }} />
          </View>
        </View>
        {!hasNutritionData ? (
          <View className="gap-3">
            <Typography tone="secondary" variant="bodyMd">
              No nutrition data has been logged yet.
            </Typography>
            <AppButton onPress={onLogFirstMeal} variant="secondary">Log First Meal</AppButton>
          </View>
        ) : null}
      </EditorialCard>

      <EditorialCard className="gap-5">
        <View className="flex-row items-center justify-between">
          <Typography tone="secondary" variant="labelSm">WEEKLY CONSISTENCY</Typography>
          <Ionicons color={colors.graphiteMuted} name="calendar-outline" size={20} />
        </View>
        <View className="flex-row items-end justify-between">
          {weeklyDots.map((dot, idx) => (
            <View className="items-center gap-2" key={idx}>
              <View
                className={
                  dot.completed
                    ? "h-12 w-8 rounded-full bg-emerald"
                    : dot.isFuture
                      ? "h-12 w-8 rounded-full border border-dashed border-border bg-transparent"
                      : "h-12 w-8 rounded-full bg-surface-muted"
                }
              >
                {!dot.completed && !dot.isFuture ? (
                  <View className="absolute bottom-1 left-1 right-1 h-2 rounded-full bg-border" />
                ) : null}
              </View>
              <Typography tone="secondary" variant="labelSm">
                {dot.label}
              </Typography>
            </View>
          ))}
        </View>
      </EditorialCard>
    </View>
  );
}
