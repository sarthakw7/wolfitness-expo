import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useMacroTargets, useNutritionLogs, useNutritionSummary } from "@/src/hooks/queries";
import { colors } from "@/src/theme";

function percent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, value / total));
}

function formatDateLabel(dateValue?: Date | string | null) {
  const parsed = dateValue ? new Date(dateValue) : new Date();
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  return safeDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    weekday: "long",
  });
}

function formatTimeLabel(dateValue: string) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "--:--";
  }

  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SegmentedRing({
  activeColor,
  inactiveColor,
  progress,
  segments,
  size,
  thickness,
}: {
  activeColor: string;
  inactiveColor: string;
  progress: number;
  segments: number;
  size: number;
  thickness: number;
}) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const activeSegments = Math.round(safeProgress * segments);
  const radius = size / 2 - thickness / 2 - 3;
  const segmentLength = Math.max(thickness * 1.5, size * 0.12);
  const center = size / 2;

  return (
    <View style={{ height: size, width: size }}>
      {Array.from({ length: segments }).map((_, index) => {
        const angle = (index / segments) * Math.PI * 2 - Math.PI / 2;
        const left = center + Math.cos(angle) * radius - thickness / 2;
        const top = center + Math.sin(angle) * radius - segmentLength / 2;

        return (
          <View
            key={index}
            style={{
              backgroundColor: index < activeSegments ? activeColor : inactiveColor,
              borderRadius: 999,
              height: segmentLength,
              left,
              position: "absolute",
              top,
              transform: [{ rotate: `${(angle * 180) / Math.PI + 90}deg` }],
              width: thickness,
            }}
          />
        );
      })}
    </View>
  );
}

function NutritionSkeleton() {
  return (
    <View className="gap-6">
      <View className="gap-1">
        <View className="h-10 w-52 rounded-full bg-surface-muted" />
        <View className="h-6 w-36 rounded-full bg-surface-muted" />
      </View>
      <EditorialCard className="min-h-[320px] bg-surface-muted" />
      <EditorialCard className="min-h-24 bg-surface-muted" />
      <EditorialCard className="min-h-24 bg-surface-muted" />
      <EditorialCard className="min-h-24 bg-surface-muted" />
      <EditorialCard className="min-h-32 bg-surface-muted" />
    </View>
  );
}

function MacroCard({
  accentColor,
  current,
  label,
  progress,
  target,
}: {
  accentColor: string;
  current: number;
  label: string;
  progress: number;
  target: number;
}) {
  return (
    <EditorialCard className="min-h-24 flex-row items-center justify-between px-5 py-4">
      <View className="flex-1 gap-1">
        <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelSm">
          {label}
        </Typography>
        <View className="flex-row items-end gap-1">
          <Typography variant="headlineLg">{Math.round(current)}</Typography>
          <Typography className="pb-1" tone="secondary" variant="bodyMd">
            / {target > 0 ? Math.round(target) : "--"}g
          </Typography>
        </View>
      </View>
      <View className="h-14 w-14 items-center justify-center">
        <SegmentedRing
          activeColor={accentColor}
          inactiveColor={colors.surfaceMuted}
          progress={progress}
          segments={18}
          size={56}
          thickness={4}
        />
      </View>
    </EditorialCard>
  );
}

function MealLogCard({
  calories,
  carbs,
  fat,
  foodName,
  mealCategory,
  protein,
  time,
}: {
  calories: number;
  carbs: number;
  fat: number;
  foodName: string;
  mealCategory: string | null;
  protein: number;
  time: string;
}) {
  return (
    <EditorialCard className="gap-5 px-5 py-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-2">
          <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelSm">
            {mealCategory ?? "Meal Log"}
          </Typography>
          <Typography variant="headlineLg">{foodName}</Typography>
          <Typography tone="secondary" variant="labelSm">
            {time}
          </Typography>
        </View>
        <View className="items-end">
          <Typography variant="headlineXl">{Math.round(calories)}</Typography>
          <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelSm">
            kcal
          </Typography>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-5">
        <Typography tone="secondary" variant="labelSm">
          {Math.round(protein)}g P
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          {Math.round(carbs)}g C
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          {Math.round(fat)}g F
        </Typography>
      </View>
    </EditorialCard>
  );
}

function AddMealCard() {
  return (
    <Link href="/(modals)/add-meal" asChild>
      <Pressable
        accessibilityRole="button"
        className="items-center justify-center rounded-2xl border border-dashed border-borderStrong px-5 py-6"
        style={styles.dashedCard}
      >
        <View className="flex-row items-center gap-3">
          <Ionicons color={colors.graphiteMuted} name="restaurant-outline" size={20} />
          <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelMd">
            Log Meal
          </Typography>
        </View>
      </Pressable>
    </Link>
  );
}

function NutritionTrackerScreenComponent() {
  const nutritionSummaryQuery = useNutritionSummary();
  const nutritionLogsQuery = useNutritionLogs();
  const macroTargetsQuery = useMacroTargets();

  useEffect(() => {
    const failures = [
      ["nutrition-summary", nutritionSummaryQuery.error],
      ["nutrition-logs", nutritionLogsQuery.error],
      ["macro-targets", macroTargetsQuery.error],
    ].filter(([, error]) => Boolean(error));

    failures.forEach(([type, error]) => {
      console.warn("[nutrition]", "Nutrition tracker query failed.", {
        message: error instanceof Error ? error.message : String(error),
        screen: "NutritionTracker",
        type,
      });
    });
  }, [macroTargetsQuery.error, nutritionLogsQuery.error, nutritionSummaryQuery.error]);

  const isLoading =
    nutritionSummaryQuery.isLoading ||
    nutritionLogsQuery.isLoading ||
    macroTargetsQuery.isLoading;

  const hasError =
    nutritionSummaryQuery.error ||
    nutritionLogsQuery.error ||
    macroTargetsQuery.error;

  const summaryDate = nutritionSummaryQuery.data?.date ?? null;
  const summary = nutritionSummaryQuery.data?.summary ?? null;
  const macroTargets = macroTargetsQuery.data ?? nutritionSummaryQuery.data?.macroTargets ?? null;
  const nutritionLogs = nutritionLogsQuery.data ?? nutritionSummaryQuery.data?.logs ?? [];

  const caloriesConsumed = summary?.total_calories ?? 0;
  const proteinConsumed = summary?.total_protein ?? 0;
  const carbsConsumed = summary?.total_carbs ?? 0;
  const fatConsumed = summary?.total_fat ?? 0;

  const calorieGoal = macroTargets?.daily_calorie_target ?? 0;
  const proteinGoal = macroTargets?.daily_protein_target ?? 0;
  const carbsGoal = macroTargets?.daily_carbs_target ?? 0;
  const fatGoal = macroTargets?.daily_fat_target ?? 0;

  const caloriesRemaining = Math.max(0, calorieGoal - caloriesConsumed);
  const calorieProgress = percent(caloriesConsumed, calorieGoal);

  const handleRetry = () => {
    nutritionSummaryQuery.refetch();
    nutritionLogsQuery.refetch();
    macroTargetsQuery.refetch();
  };

  const mealCards = useMemo(() => {
    return [...nutritionLogs]
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map((log) => ({
        calories: log.calories ?? 0,
        carbs: log.carbs ?? 0,
        fat: log.fat ?? 0,
        foodName: log.food_name,
        id: log.id,
        mealCategory: log.meal_category,
        protein: log.protein ?? 0,
        time: formatTimeLabel(log.created_at),
      }));
  }, [nutritionLogs]);

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar />}>
      <View className="gap-6 px-2">
        <View className="gap-1">
          <Typography variant="headlineXl">Daily Nutrition</Typography>
          <Typography tone="secondary" variant="bodyLg">
            {formatDateLabel(summaryDate)}
          </Typography>
        </View>

        <Link href="/(modals)/ai-assistant" asChild>
          <AppButton
            className="border-borderStrong bg-surface-raised"
            iconLeft={<Ionicons color={colors.graphite} name="sparkles-outline" size={16} />}
            variant="ghost"
          >
            Ask Nutrition Assistant
          </AppButton>
        </Link>

        {hasError ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load nutrition</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please try again in a moment.
            </Typography>
            <AppButton onPress={handleRetry} variant="secondary">
              Retry
            </AppButton>
          </EditorialCard>
        ) : null}

        {isLoading ? <NutritionSkeleton /> : null}

        {!isLoading && !hasError ? (
          <>
            {!macroTargets ? (
              <EditorialCard className="gap-3">
                <Typography variant="headlineLg">Set Nutrition Goals</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  Add your daily calorie and macro targets so nutrition progress can track against your plan.
                </Typography>
                <Link href="/(modals)/nutrition-goals" asChild>
                  <AppButton variant="secondary">Set Nutrition Goals</AppButton>
                </Link>
              </EditorialCard>
            ) : null}

            <EditorialCard className="min-h-[320px] items-center justify-center gap-8 px-6 py-6">
              <View className="w-full flex-row items-start justify-between">
                <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelSm">
                  Energy Balance
                </Typography>
                <Ionicons color={colors.graphiteMuted} name="analytics-outline" size={20} />
              </View>

              <View className="h-56 w-56 items-center justify-center">
                <View className="absolute inset-0 items-center justify-center">
                  <SegmentedRing
                    activeColor={colors.emerald}
                    inactiveColor={colors.surfaceMuted}
                    progress={calorieProgress}
                    segments={36}
                    size={224}
                    thickness={8}
                  />
                </View>
                <View className="items-center gap-1">
                  <Typography variant="displayLg">{Math.round(caloriesConsumed).toLocaleString()}</Typography>
                  <Typography className="uppercase tracking-[1.5px]" tone="secondary" variant="labelSm">
                    kcal consumed
                  </Typography>
                </View>
              </View>

              <View className="w-full flex-row justify-between px-4">
                <View className="items-center">
                  <Typography variant="bodyMd">
                    {calorieGoal > 0 ? Math.round(calorieGoal).toLocaleString() : "--"}
                  </Typography>
                  <Typography tone="secondary" variant="labelSm">
                    Goal
                  </Typography>
                </View>
                <View className="items-center">
                  <Typography tone="accent" variant="bodyMd">
                    {calorieGoal > 0 ? Math.round(caloriesRemaining).toLocaleString() : "--"}
                  </Typography>
                  <Typography tone="secondary" variant="labelSm">
                    Remaining
                  </Typography>
                </View>
              </View>
            </EditorialCard>

            <View className="gap-4">
              <MacroCard
                accentColor={colors.graphite}
                current={proteinConsumed}
                label="Protein"
                progress={percent(proteinConsumed, proteinGoal)}
                target={proteinGoal}
              />
              <MacroCard
                accentColor={colors.graphiteMuted}
                current={carbsConsumed}
                label="Carbs"
                progress={percent(carbsConsumed, carbsGoal)}
                target={carbsGoal}
              />
              <MacroCard
                accentColor={colors.raw.surfaceDim}
                current={fatConsumed}
                label="Fat"
                progress={percent(fatConsumed, fatGoal)}
                target={fatGoal}
              />
            </View>

            <View className="gap-4">
              <View className="flex-row items-end justify-between border-b border-border pb-2">
                <Typography variant="headlineLg">Today&apos;s Log</Typography>
                <Link href="/(modals)/add-meal" asChild>
                  <Pressable accessibilityRole="button" className="flex-row items-center gap-1">
                    <Ionicons color={colors.emerald} name="add" size={16} />
                    <Typography className="uppercase tracking-[1.5px]" tone="accent" variant="labelSm">
                      Add Item
                    </Typography>
                  </Pressable>
                </Link>
              </View>

              {mealCards.length === 0 ? (
                <EditorialCard className="gap-3">
                  <Typography variant="headlineLg">No meals logged today</Typography>
                  <Typography tone="secondary" variant="bodyMd">
                    Add your first meal to start tracking today&apos;s nutrition.
                  </Typography>
                </EditorialCard>
              ) : (
                mealCards.map((meal) => (
                  <MealLogCard
                    calories={meal.calories}
                    carbs={meal.carbs}
                    fat={meal.fat}
                    foodName={meal.foodName}
                    key={meal.id}
                    mealCategory={meal.mealCategory}
                    protein={meal.protein}
                    time={meal.time}
                  />
                ))
              )}

              <AddMealCard />

              <Link href="/(modals)/ai-assistant" asChild>
                <AppButton iconLeft={<Ionicons color={colors.white} name="sparkles-outline" size={16} />}>
                  Ask Nutrition Assistant
                </AppButton>
              </Link>
            </View>
          </>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  dashedCard: {
    borderStyle: "dashed",
  },
});

export const NutritionTrackerScreen = memo(NutritionTrackerScreenComponent);
