import { Ionicons } from "@expo/vector-icons";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import {
  AppTopBar,
  Chip,
  EditorialCard,
  ProgressBar,
  ScreenScaffold,
  StatCard,
} from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useProgressOverview } from "@/src/hooks/queries";
import type { ProgressRange, ProgressTrendPoint } from "@/src/services/progress.service";
import { colors } from "@/src/theme";

function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function chartValue(point: ProgressTrendPoint) {
  return point.target ? point.percentOfTarget : point.value > 0 ? 0.2 : 0;
}

function ChartFrame({
  calorieTrend,
  hasNutrition,
  proteinTrend,
  range,
  selectedMetric,
  setSelectedMetric,
}: {
  calorieTrend: ProgressTrendPoint[];
  hasNutrition: boolean;
  proteinTrend: ProgressTrendPoint[];
  range: ProgressRange;
  selectedMetric: "protein" | "calories";
  setSelectedMetric: (metric: "protein" | "calories") => void;
}) {
  const points = selectedMetric === "protein" ? proteinTrend : calorieTrend;
  const labelPrefix = range === "7d" ? "D" : "W";

  return (
    <EditorialCard className="gap-6">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Typography variant="headlineLg">Nutrition Trend</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {selectedMetric === "protein" ? "Protein target completion" : "Calorie target completion"}
          </Typography>
        </View>
        <View className="gap-2">
          <Pressable onPress={() => setSelectedMetric("calories")}>
            <Chip active={selectedMetric === "calories"} label="Calories" />
          </Pressable>
          <Pressable onPress={() => setSelectedMetric("protein")}>
            <Chip active={selectedMetric === "protein"} label="Protein" />
          </Pressable>
        </View>
      </View>
      <View className="h-64 justify-between">
        {[0, 1, 2, 3].map((line) => (
          <View className="h-px bg-border" key={line} />
        ))}
        {hasNutrition ? (
          <View className="absolute bottom-10 left-6 right-6 h-28 flex-row items-end justify-between">
            {points.map((point, index) => {
              const value = Math.max(0.06, chartValue(point));
              const shouldShowLabel = range === "7d" || index % 5 === 0 || index === points.length - 1;
              return (
                <View className="items-center gap-2" key={point.date}>
                  <View
                    className="w-7 rounded-full bg-emerald"
                    style={{ height: 18 + value * 110 }}
                  />
                  <Typography tone="secondary" variant="labelSm">
                    {shouldShowLabel ? `${labelPrefix}${index + 1}` : ""}
                  </Typography>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="absolute inset-x-6 bottom-12 items-center rounded-2xl border border-border bg-surface-muted p-4">
            <Typography variant="headlineLg">No nutrition data yet</Typography>
            <Typography align="center" tone="secondary" variant="bodyMd">
              Log meals and set targets to populate this chart.
            </Typography>
          </View>
        )}
      </View>
    </EditorialCard>
  );
}

function ProgressAnalyticsScreenComponent() {
  const [range, setRange] = useState<ProgressRange>("7d");
  const [selectedMetric, setSelectedMetric] = useState<"protein" | "calories">("protein");
  const progressQuery = useProgressOverview(range);
  const progress = progressQuery.data;

  useEffect(() => {
    if (progressQuery.error) {
      console.warn("[progress]", "Progress analytics screen failed.", {
        error: progressQuery.error instanceof Error ? progressQuery.error.message : String(progressQuery.error),
        range,
      });
    }
  }, [progressQuery.error, range]);

  const hasSessions = (progress?.weeklyWorkoutCount ?? 0) > 0;
  const hasVolume = (progress?.weeklyVolume ?? 0) > 0;
  const hasNutrition = (progress?.nutritionAdherence.daysWithNutrition ?? 0) > 0;
  const totalMinutes = useMemo(() => {
    return (progress?.recentSessions ?? []).reduce((total, session) => total + (session.durationMinutes ?? 0), 0);
  }, [progress?.recentSessions]);
  const averageMinutes = progress?.recentSessions.length ? Math.round(totalMinutes / progress.recentSessions.length) : 0;
  const nutritionScore = progress
    ? Math.max(progress.nutritionAdherence.proteinAveragePercent, progress.nutritionAdherence.calorieAveragePercent)
    : 0;

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar />}>
      <View className="gap-6 px-2">
        <View className="gap-2">
        <Typography variant="displayLg">Performance Analytics</Typography>
        <Typography tone="secondary" variant="bodyLg">
          A comprehensive overview of strength progression and training volume.
        </Typography>
        </View>

      <View className="flex-row gap-2">
        <Pressable onPress={() => setRange("7d")}>
          <Chip active={range === "7d"} label="7D" />
        </Pressable>
        <Pressable onPress={() => setRange("30d")}>
          <Chip active={range === "30d"} label="30D" />
        </Pressable>
      </View>

      {progressQuery.isLoading ? (
        <View className="gap-gutter">
          <EditorialCard className="min-h-64 bg-surface-muted" />
          <EditorialCard className="min-h-36 bg-surface-muted" />
          <EditorialCard className="min-h-36 bg-surface-muted" />
        </View>
      ) : null}

      {progressQuery.error ? (
        <EditorialCard className="gap-3">
          <Typography variant="headlineLg">Unable to load progress</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please retry in a moment.
          </Typography>
          <AppButton onPress={() => progressQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </EditorialCard>
      ) : null}

      {!progressQuery.isLoading && !progressQuery.error && progress ? (
        <>
          <ChartFrame
            calorieTrend={progress.calorieTrend}
            hasNutrition={hasNutrition}
            proteinTrend={progress.proteinTrend}
            range={range}
            selectedMetric={selectedMetric}
            setSelectedMetric={setSelectedMetric}
          />
          <View className="gap-gutter">
            <StatCard
              icon="barbell-outline"
              label="Total Volume"
              progress={hasVolume ? Math.min(1, progress.weeklyVolume / (range === "7d" ? 10000 : 40000)) : 0}
              tone="glass"
              trend={hasVolume ? `${progress.weeklyWorkoutCount} completed sessions` : "No workout logs yet"}
              unit="kg"
              value={formatNumber(progress.weeklyVolume)}
            />
            <StatCard
              icon="timer-outline"
              label="Active Time"
              progress={hasSessions ? progress.consistencyPercent : 0}
              tone="glass"
              trend={hasSessions ? `Avg ${averageMinutes}m per session` : "No workout history yet"}
              value={formatDuration(totalMinutes)}
            />
            <EditorialCard className="gap-4">
              <View className="flex-row items-center gap-2">
                <Ionicons color={colors.graphiteMuted} name="pulse-outline" size={20} />
                <Typography tone="secondary" variant="labelSm">
                  Nutrition Adherence
                </Typography>
              </View>
              <ProgressBar progress={nutritionScore} tone="accent" />
              <Typography variant="headlineXl">{formatPercent(nutritionScore)}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {hasNutrition
                  ? `${progress.nutritionAdherence.daysWithNutrition} nutrition days logged · ${progress.currentStreak} day streak`
                  : "No nutrition data yet"}
              </Typography>
            </EditorialCard>
          </View>
        </>
      ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const ProgressAnalyticsScreen = memo(ProgressAnalyticsScreenComponent);
