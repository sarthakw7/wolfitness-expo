import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo } from "react";
import { ImageBackground, View } from "react-native";

import {
  AppTopBar,
  EditorialCard,
  ScreenScaffold,
  SectionTitle,
  StatCard,
} from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

const breakfastImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAbGD0pVnwuCk3-EkwmVD-yiV0YANZrzRoQuAZGqsjFKG7XtTxSc3Jja7YbR6o6cJutqoWle0LDcnPCVprXVUmrhvxslKdECL53EgF1p3G86fxWNV4uw35gMrOPslo7soPLz_3qHnW-S5Kfek9jXtYQw8kEdyi2PPYhjm0eqNdQe1ZbwuTZ1zY3C2RLsY9YoFa44GX0xNRN0ANXKMKCs4sPV14igbj0UxN-dosXjKNTi2XXwW5sTkrnK2B5HiflJTJewm8lwTL3x_nw";

function MacroRow({ label, progress, value }: { label: string; progress: number; value: string }) {
  return (
    <StatCard className="min-h-24" label={label} progress={progress} value={value} />
  );
}

function MealCard() {
  return (
    <EditorialCard className="overflow-hidden p-0">
      <View className="flex-row">
        <View className="w-28 bg-surface-muted">
          <ImageBackground source={{ uri: breakfastImage }} style={{ flex: 1 }} />
        </View>
        <View className="flex-1 gap-3 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Typography variant="headlineLg">Breakfast Bowl</Typography>
              <Typography tone="secondary" variant="bodyMd">
                Oats, berries, chia, isolate
              </Typography>
            </View>
            <Typography tone="secondary" variant="labelSm">
              08:10
            </Typography>
          </View>
          <View className="flex-row justify-between">
            <Typography tone="secondary" variant="labelSm">520 kcal</Typography>
            <Typography tone="secondary" variant="labelSm">38P / 62C / 14F</Typography>
          </View>
        </View>
      </View>
    </EditorialCard>
  );
}

function NutritionTrackerScreenComponent() {
  return (
    <ScreenScaffold header={<AppTopBar />}>
      <View className="gap-1">
        <Typography variant="headlineXl">Daily Nutrition</Typography>
        <Typography tone="secondary" variant="bodyLg">
          Thursday, Oct 24
        </Typography>
      </View>

      <EditorialCard className="min-h-[300px] items-center justify-center gap-7">
        <View className="w-full flex-row items-start justify-between">
          <Typography tone="secondary" variant="labelSm">
            Energy Balance
          </Typography>
          <Ionicons color={colors.graphiteMuted} name="analytics-outline" size={20} />
        </View>
        <View className="h-48 w-48 items-center justify-center rounded-full border-[10px] border-surface-muted">
          <View className="h-40 w-40 items-center justify-center rounded-full border-[8px] border-emerald">
            <Typography variant="displayLg">1,840</Typography>
            <Typography tone="secondary" variant="labelSm">
              kcal consumed
            </Typography>
          </View>
        </View>
        <View className="w-full flex-row justify-between px-4">
          <View>
            <Typography align="center" variant="bodyMd">2,400</Typography>
            <Typography align="center" tone="secondary" variant="labelSm">Goal</Typography>
          </View>
          <View>
            <Typography align="center" tone="accent" variant="bodyMd">560</Typography>
            <Typography align="center" tone="secondary" variant="labelSm">Remaining</Typography>
          </View>
        </View>
      </EditorialCard>

      <View className="gap-gutter">
        <MacroRow label="Protein" progress={0.75} value="112 / 150g" />
        <MacroRow label="Carbs" progress={0.72} value="180 / 250g" />
        <MacroRow label="Fat" progress={0.77} value="54 / 70g" />
      </View>

      <View className="gap-4">
        <SectionTitle
          action={
            <Link href="/(modals)/add-meal" asChild>
              <AppButton size="sm" variant="ghost">Add</AppButton>
            </Link>
          }
          title="Today's Log"
        />
        <MealCard />
        <Link href="/(modals)/ai-assistant" asChild>
          <AppButton iconLeft={<Ionicons color={colors.white} name="sparkles-outline" size={16} />}>
            Ask Nutrition Assistant
          </AppButton>
        </Link>
      </View>
    </ScreenScaffold>
  );
}

export const NutritionTrackerScreen = memo(NutritionTrackerScreenComponent);
