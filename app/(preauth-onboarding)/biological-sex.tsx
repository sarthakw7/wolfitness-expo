import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion, OnboardingSubtext } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

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
          ? "flex-row items-center justify-between rounded-lg border border-[#242424] bg-[#242424] p-4"
          : "flex-row items-center justify-between rounded-lg border border-[#242424] bg-transparent p-4"
      }
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
    >
      <View className="flex-row items-center gap-4">
        <Ionicons color={active ? "#c8c6c5" : "#c4c7c7"} name={icon} size={22} />
        <Typography
          // Use explicit inline color here (most reliable across Android OEM builds for nested Text).
          // Keep tone inverse as a safe default, but style is the source of truth.
          tone="inverse"
          style={{ color: active ? "#F4F1EE" : "#C4C7C7" }}
          variant="bodyLg"
        >
          {label}
        </Typography>
      </View>
      <View
        className={
          active
            ? "h-4 w-4 items-center justify-center rounded-full border-2 border-[#c8c6c5]"
            : "h-4 w-4 rounded-full border-2 border-[#242424]"
        }
      >
        {active ? <View className="h-2 w-2 rounded-full bg-[#c8c6c5]" /> : null}
      </View>
    </Pressable>
  );
}

export default function BiologicalSexRoute() {
  const { user } = useAuth();
  const [value, setValue] = useState<"male" | "female" | null>(null);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const gender = draft?.gender;
        if (gender === "male" || gender === "female") setValue(gender);
      })
      .catch(() => {});
  }, []);

  const handleContinue = useCallback(async () => {
    if (!value) return;
    await mergeOnboardingDraft({ gender: value });
    router.push("/(preauth-onboarding)/date-of-birth");
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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-md gap-12 self-center" style={{ width: "100%" }}>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 01 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                14%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "14%" }} />
            </View>
          </View>

          <View className="gap-3">
            <OnboardingQuestion>What is your biological sex?</OnboardingQuestion>
            <OnboardingSubtext>
              This helps us calculate more accurate physiological baselines for your performance metrics.
            </OnboardingSubtext>
          </View>

          <View className="gap-3">
            <OptionRow active={value === "male"} icon="male-outline" label="Male" onPress={() => setValue("male")} />
            <OptionRow active={value === "female"} icon="female-outline" label="Female" onPress={() => setValue("female")} />
          </View>

          <OnboardingContinueButton disabled={!value} onPress={handleContinue} />
        </View>
      </ScreenContainer>
    </View>
  );
}
