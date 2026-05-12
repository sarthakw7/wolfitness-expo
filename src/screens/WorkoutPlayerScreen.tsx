import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ImageBackground, TextInput, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

const exerciseImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDLbY-JCX4z78cFa78XsKxs2db48YFH1qCB-P6E-Z3ZXBTY5LNBQrucskcuW5Eb4fRGlHcR7l3kkJh9dsWpYxptVAKlDUXv2M5hU6T-eypbvMaN_OQ16hJXB--_ZCQI6ZhTqmU5ryTm8Py1MbNEs9uesGu1C7i9pI1cLhlV3djX6iqIqrFc4gVxUrWM4wx03XFFAznSt9UE4htIiivyk_KBlf6SW3tlxhQlJXbNCkhgnP4eR8o5NOvG-thEbWmHdfrA48B17WH1TsUQ";

function SetRow({ active, complete, index, label }: { active?: boolean; complete?: boolean; index: number; label: string }) {
  return (
    <GlassCard className={active ? "border-border-strong bg-glass-strong" : "opacity-80"}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-3">
          <Typography tone={active ? "primary" : "secondary"} variant="headlineLg">
            {index}
          </Typography>
          <Chip label={label} />
        </View>
        <View className="flex-row items-center gap-4">
          <TextInput
            accessibilityLabel={`Set ${index} pounds`}
            defaultValue={complete || active ? (index === 1 ? "45" : "65") : undefined}
            placeholder="-"
            placeholderTextColor={colors.graphiteSubtle}
            style={{
              width: 48,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              textAlign: "center",
              fontFamily: "Manrope",
              fontSize: 18,
              color: colors.graphite,
            }}
          />
          <TextInput
            accessibilityLabel={`Set ${index} reps`}
            defaultValue={complete || active ? (index === 1 ? "12" : "10") : undefined}
            placeholder="-"
            placeholderTextColor={colors.graphiteSubtle}
            style={{
              width: 48,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              textAlign: "center",
              fontFamily: "Manrope",
              fontSize: 18,
              color: colors.graphite,
            }}
          />
          <View className={complete ? "h-8 w-8 items-center justify-center rounded-full bg-emerald" : "h-8 w-8 items-center justify-center rounded-full border border-border"}>
            <Ionicons color={complete ? colors.white : colors.graphiteSubtle} name="checkmark" size={16} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function WorkoutPlayerScreenComponent() {
  return (
    <ScreenScaffold
      header={<AppTopBar centered subtitle="Upper Body Power" taskMode title="3 of 8 Exercises" />}
      taskMode
    >
      <View className="aspect-[4/3] overflow-hidden rounded-3xl bg-surface-muted">
        <ImageBackground
          accessibilityLabel="Exercise demonstration"
          source={{ uri: exerciseImage }}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <View className="flex-1 items-center justify-center bg-black/10">
            <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/80">
              <Ionicons color={colors.graphite} name="play" size={30} />
            </View>
          </View>
        </ImageBackground>
      </View>

      <View className="gap-3">
        <View className="flex-row gap-2">
          <Chip label="Chest" />
          <Chip label="Hypertrophy" />
        </View>
        <Typography variant="displayLg">Incline Dumbbell Press</Typography>
        <Typography tone="secondary" variant="bodyLg">
          Maintain a 30-degree incline. Keep elbows tucked at a 45-degree angle and control the eccentric phase.
        </Typography>
      </View>

      <GlassCard className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-emerald">
            <Ionicons color={colors.emerald} name="timer-outline" size={22} />
          </View>
          <View>
            <Typography tone="secondary" variant="labelSm">
              Rest Timer
            </Typography>
            <Typography variant="headlineXl">01:45</Typography>
          </View>
        </View>
        <Typography variant="labelMd">Skip Rest</Typography>
      </GlassCard>

      <EditorialCard className="gap-3">
        <View className="flex-row items-end justify-between border-b border-border pb-2">
          <Typography variant="headlineLg">Target Sets</Typography>
          <View className="flex-row gap-6">
            <Typography tone="secondary" variant="labelSm">Lbs</Typography>
            <Typography tone="secondary" variant="labelSm">Reps</Typography>
          </View>
        </View>
        <SetRow complete index={1} label="Warmup" />
        <SetRow active index={2} label="Working" />
        <SetRow index={3} label="Working" />
        <SetRow index={4} label="Working" />
        <AppButton variant="secondary">Complete Set</AppButton>
      </EditorialCard>
    </ScreenScaffold>
  );
}

export const WorkoutPlayerScreen = memo(WorkoutPlayerScreenComponent);
