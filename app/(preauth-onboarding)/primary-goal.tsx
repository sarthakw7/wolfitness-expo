import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion, OnboardingSubtext } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

type GoalValue = "build_muscle" | "lose_fat" | "increase_endurance" | "improve_mobility";

const GOALS: Array<{
  value: GoalValue;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "build_muscle", label: "Build Muscle", icon: "barbell-outline" },
  { value: "lose_fat", label: "Lose Fat", icon: "flame-outline" },
  { value: "increase_endurance", label: "Increase Endurance", icon: "walk-outline" },
  { value: "improve_mobility", label: "Improve Mobility", icon: "accessibility-outline" },
];

function OptionRow({
  active,
  icon,
  label,
  onPress,
}: {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={
        active
          ? "flex-row items-center rounded-lg border border-[#444748] bg-[#2b2a2a] p-4"
          : "flex-row items-center rounded-lg border border-[#2b2a2a] bg-[#e5e2e1] p-4"
      }
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
    >
      <View
        className={
          active
            ? "h-10 w-10 items-center justify-center rounded-full border border-[#2b2a2a] bg-[#201f1f]"
            : "h-10 w-10 items-center justify-center rounded-full border border-[#353434] bg-[#141313]"
        }
      >
        <Ionicons color={active ? "#e5e2e1" : "#F4F1EE"} name={icon} size={20} />
      </View>
      <View className="ml-4 flex-1">
        <Typography
          // Inline color is the most reliable across Android OEM builds for nested Text in Pressables.
          tone={active ? "inverse" : "primary"}
          style={{ color: active ? "#F4F1EE" : "#141313", fontFamily: undefined, fontWeight: "700" }}
          variant="headlineLg"
        >
          {label}
        </Typography>
      </View>
      <View
        className={
          active
            ? "ml-4 h-5 w-5 items-center justify-center rounded-full border border-[#e5e2e1]"
            : "ml-4 h-5 w-5 rounded-full border border-[#141313]"
        }
        style={active ? { borderWidth: 6 } : { borderWidth: 1 }}
      />
    </Pressable>
  );
}

export default function PrimaryGoalRoute() {
  const { user } = useAuth();
  const [value, setValue] = useState<GoalValue | null>(null);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const g = draft?.primaryGoal;
        if (g && GOALS.some((x) => x.value === g)) setValue(g as GoalValue);
      })
      .catch(() => {});
  }, []);

  const canContinue = useMemo(() => Boolean(value), [value]);

  const handleContinue = useCallback(async () => {
    if (!value) return;
    await mergeOnboardingDraft({ primaryGoal: value });
    router.push("/(preauth-onboarding)/experience-level");
  }, [value]);

  return (
    <View className="flex-1 bg-[#141313]">
      <View className="h-16 w-full flex-row items-center justify-between border-b border-[#353434] px-8">
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
          <Ionicons color="#e5e2e1" name="arrow-back" size={20} />
        </Pressable>
        <Typography className="tracking-[3px] text-[#F4F1EE]" variant="labelSm">
          CALIBRATION
        </Typography>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.replace(user?.id ? "/(tabs)" : "/(auth)/sign-up")}
        >
          <Typography className="tracking-[2px] text-[#F4F1EE]" variant="labelSm">
            SKIP
          </Typography>
        </Pressable>
      </View>

      <ScreenContainer
        scroll
        className="bg-[#141313]"
        contentClassName="flex-grow px-0 py-0"
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 48 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-3xl self-center" style={{ width: "100%" }}>
          <View className="mb-10 gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 04 OF 08
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                50%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "50%" }} />
            </View>
          </View>

          <View className="mb-10 gap-3">
            <OnboardingQuestion>What is your primary goal?</OnboardingQuestion>
            <OnboardingSubtext>
              Select the objective that best aligns with your current training focus to calibrate your regimen.
            </OnboardingSubtext>
          </View>

          <View className="gap-3">
            {GOALS.map((g) => (
              <OptionRow key={g.value} active={value === g.value} icon={g.icon} label={g.label} onPress={() => setValue(g.value)} />
            ))}
          </View>

          <View className="mt-8">
            <OnboardingContinueButton disabled={!canContinue} onPress={handleContinue} />
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}
