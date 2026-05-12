import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { View } from "react-native";

import {
  AppTopBar,
  Chip,
  EditorialCard,
  ProgressBar,
  ScreenScaffold,
  StatCard,
} from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

function ChartFrame() {
  return (
    <EditorialCard className="gap-6">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Typography variant="headlineLg">Strength Progression</Typography>
          <Typography tone="secondary" variant="bodyMd">
            1RM estimates over 12 weeks
          </Typography>
        </View>
        <View className="gap-2">
          <Chip label="Bench" />
          <Chip active label="Squat" />
        </View>
      </View>
      <View className="h-64 justify-between">
        {[0, 1, 2, 3].map((line) => (
          <View className="h-px bg-border" key={line} />
        ))}
        <View className="absolute bottom-10 left-6 right-6 h-28 flex-row items-end justify-between">
          {[0.25, 0.42, 0.5, 0.7, 0.82, 1].map((value, index) => (
            <View className="items-center gap-2" key={index}>
              <View
                className="w-7 rounded-full bg-emerald"
                style={{ height: 44 + value * 84 }}
              />
              <Typography tone="secondary" variant="labelSm">
                W{index * 2 + 1}
              </Typography>
            </View>
          ))}
        </View>
      </View>
    </EditorialCard>
  );
}

function ProgressAnalyticsScreenComponent() {
  return (
    <ScreenScaffold header={<AppTopBar />}>
      <View className="gap-2">
        <Typography variant="displayLg">Performance Analytics</Typography>
        <Typography tone="secondary" variant="bodyLg">
          A comprehensive overview of strength progression and training volume.
        </Typography>
      </View>

      <ChartFrame />
      <View className="gap-gutter">
        <StatCard
          icon="barbell-outline"
          label="Total Volume"
          progress={0.84}
          tone="glass"
          trend="+5.2% this month"
          unit="lbs"
          value="124,500"
        />
        <StatCard
          icon="timer-outline"
          label="Active Time"
          progress={0.68}
          tone="glass"
          trend="Avg 65m per session"
          value="24h 15m"
        />
        <EditorialCard className="gap-4">
          <View className="flex-row items-center gap-2">
            <Ionicons color={colors.graphiteMuted} name="pulse-outline" size={20} />
            <Typography tone="secondary" variant="labelSm">
              Recovery Readiness
            </Typography>
          </View>
          <ProgressBar progress={0.91} tone="accent" />
          <Typography variant="headlineXl">91%</Typography>
        </EditorialCard>
      </View>
    </ScreenScaffold>
  );
}

export const ProgressAnalyticsScreen = memo(ProgressAnalyticsScreenComponent);
