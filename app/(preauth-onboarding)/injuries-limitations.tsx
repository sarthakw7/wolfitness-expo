import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion, OnboardingSubtext } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

type InjuryKey = "knees" | "lower_back" | "wrists" | "shoulders" | "hips" | "other";

const OPTIONS: Array<{ key: InjuryKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "knees", label: "Knees", icon: "walk-outline" },
  { key: "lower_back", label: "Lower Back", icon: "accessibility-outline" },
  { key: "wrists", label: "Wrists", icon: "hand-left-outline" },
  { key: "shoulders", label: "Shoulders", icon: "barbell-outline" },
  { key: "hips", label: "Hips", icon: "body-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal" },
];

function toggle(list: InjuryKey[], key: InjuryKey) {
  return list.includes(key) ? list.filter((x) => x !== key) : [...list, key];
}

function InjuryCard({
  active,
  label,
  icon,
  onPress,
}: {
  active?: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={
        active
          ? "relative min-h-[140px] flex-1 rounded-lg border border-[#c8c6c5] bg-[#2b2a2a] p-5"
          : "relative min-h-[140px] flex-1 rounded-lg border border-[#2b2a2a] bg-[#e5e2e1] p-5"
      }
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
    >
      <View className="flex-row items-start justify-between">
        <View
          className={
            active
              ? "h-10 w-10 items-center justify-center rounded-full border border-[#2b2a2a] bg-[#201f1f]"
              : "h-10 w-10 items-center justify-center rounded-full border border-[#353434] bg-[#141313]"
          }
        >
          <Ionicons color={active ? "#c8c6c5" : "#F4F1EE"} name={icon} size={18} />
        </View>
        <View
          className={
            active
              ? "h-4 w-4 items-center justify-center rounded-full border border-[#c8c6c5] bg-[#c8c6c5]"
              : "h-4 w-4 rounded-full border border-[#141313]"
          }
        >
          {active ? <View className="h-1.5 w-1.5 rounded-full bg-[#141313]" /> : null}
        </View>
      </View>
      <View className="mt-6">
        <Typography
          tone={active ? "inverse" : "primary"}
          style={{ color: active ? "#F4F1EE" : "#141313", fontFamily: undefined, fontWeight: "700" }}
          variant="headlineLg"
        >
          {label}
        </Typography>
      </View>
    </Pressable>
  );
}

export default function InjuriesLimitationsRoute() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<InjuryKey[]>([]);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const list = draft?.injuries;
        if (Array.isArray(list)) {
          setSelected(list.filter((x): x is InjuryKey => OPTIONS.some((o) => o.key === x)));
        }
      })
      .catch(() => {});
  }, []);

  const selectedLabels = useMemo(() => selected, [selected]);

  const handleContinue = useCallback(async () => {
    await mergeOnboardingDraft({ injuries: selectedLabels });
    router.push("/(preauth-onboarding)/athlete-vibe-reveal");
  }, [selectedLabels]);

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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 140 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-md gap-12 self-center" style={{ width: "100%" }}>
          {/* Step + Progress (match biological-sex layout) */}
          <View className="w-full flex flex-col gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 07 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                100%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full w-full rounded-full bg-[#c8c6c5]" />
            </View>
          </View>

          <View className="gap-3">
            <OnboardingQuestion>Any injuries or limitations?</OnboardingQuestion>
            <OnboardingSubtext>Select any areas that require care.</OnboardingSubtext>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {OPTIONS.map((o) => (
              <View key={o.key} className="mb-4" style={{ width: "48%" }}>
                <InjuryCard active={selected.includes(o.key)} icon={o.icon} label={o.label} onPress={() => setSelected((s) => toggle(s, o.key))} />
              </View>
            ))}
          </View>
        </View>
      </ScreenContainer>

      <View className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <OnboardingContinueButton onPress={handleContinue} />
      </View>
    </View>
  );
}
