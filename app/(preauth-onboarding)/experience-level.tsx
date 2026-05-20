import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

type LevelValue = "beginner" | "intermediate" | "advanced" | "elite";

const LEVELS: Array<{
  value: LevelValue;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "beginner",
    title: "Beginner",
    description: "New to structured training or returning after a prolonged period of inactivity.",
    icon: "leaf-outline",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Consistent training history for 1-2 years with familiarity of basic programming.",
    icon: "trending-up-outline",
  },
  {
    value: "advanced",
    title: "Advanced",
    description: "Highly experienced with a deep understanding of mechanics and competitive goals.",
    icon: "flash-outline",
  },
  {
    value: "elite",
    title: "Elite",
    description: "Professional or top-tier amateur athlete requiring highly specialized periodization.",
    icon: "trophy-outline",
  },
];

function OptionRow({
  active,
  title,
  description,
  icon,
  onPress,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={
        active
          ? "flex-row items-start rounded-lg border border-[#444748] bg-[#2b2a2a] p-4"
          : "flex-row items-start rounded-lg border border-[#2b2a2a] bg-[#e5e2e1] p-4"
      }
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
    >
      <View className={active ? "mt-0.5 h-10 w-10 items-center justify-center rounded-full border border-[#2b2a2a] bg-[#201f1f]" : "mt-0.5 h-10 w-10 items-center justify-center rounded-full border border-[#353434] bg-[#141313]"}>
        <Ionicons color={active ? "#e5e2e1" : "#F4F1EE"} name={icon} size={18} />
      </View>

      <View className="ml-4 flex-1">
        <Typography
          tone={active ? "inverse" : "primary"}
          style={{ color: active ? "#F4F1EE" : "#141313", fontFamily: undefined, fontWeight: "700" }}
          variant="headlineLg"
        >
          {title}
        </Typography>
        <View className="h-2" />
        <Typography
          tone={active ? "inverse" : "primary"}
          style={{ color: active ? "#F4F1EE" : "#141313", fontFamily: undefined, fontWeight: "500" }}
          variant="bodyMd"
        >
          {description}
        </Typography>
      </View>

      <View
        className={
          active
            ? "ml-4 mt-1 h-5 w-5 items-center justify-center rounded-full border-2 border-[#c8c6c5]"
            : "ml-4 mt-1 h-5 w-5 rounded-full border-2 border-[#141313]"
        }
      >
        {active ? <View className="h-2.5 w-2.5 rounded-full bg-[#c8c6c5]" /> : null}
      </View>
    </Pressable>
  );
}

export default function ExperienceLevelRoute() {
  const { user } = useAuth();
  const [value, setValue] = useState<LevelValue | null>(null);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const v = draft?.experienceLevel;
        if (v && LEVELS.some((x) => x.value === v)) setValue(v as LevelValue);
      })
      .catch(() => {});
  }, []);

  const canContinue = useMemo(() => Boolean(value), [value]);

  const handleContinue = useCallback(async () => {
    if (!value) return;
    await mergeOnboardingDraft({ experienceLevel: value });
    router.push("/(preauth-onboarding)/equipment-access");
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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 140 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-md gap-12 self-center" style={{ width: "100%" }}>
          <View className="w-full flex flex-col gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 05 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                71%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "71%" }} />
            </View>
          </View>

          <OnboardingQuestion>What is your experience level?</OnboardingQuestion>

          <View className="gap-3">
            {LEVELS.map((l) => (
              <OptionRow
                key={l.value}
                active={value === l.value}
                description={l.description}
                icon={l.icon}
                title={l.title}
                onPress={() => setValue(l.value)}
              />
            ))}
          </View>
        </View>
      </ScreenContainer>

      <View className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <OnboardingContinueButton disabled={!canContinue} onPress={handleContinue} />
      </View>
    </View>
  );
}
