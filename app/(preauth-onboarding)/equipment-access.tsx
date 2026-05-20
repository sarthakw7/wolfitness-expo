import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

type EquipmentValue = "full_gym" | "home_gym" | "dumbbells" | "bodyweight";

const OPTIONS: Array<{
  value: EquipmentValue;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "full_gym",
    title: "Full Gym",
    description: "Access to commercial machines, cables, and comprehensive free weights.",
    icon: "business-outline",
  },
  {
    value: "home_gym",
    title: "Home Gym",
    description: "Basic power rack, adjustable bench, and barbell setup.",
    icon: "home-outline",
  },
  {
    value: "dumbbells",
    title: "Dumbbells Only",
    description: "Limited to a set of dumbbells and potentially a bench.",
    icon: "barbell-outline",
  },
  {
    value: "bodyweight",
    title: "Bodyweight",
    description: "No external loading. Relying purely on calisthenics and gravity.",
    icon: "accessibility-outline",
  },
];

function EquipmentCard({
  active,
  title,
  description,
  icon,
  onPress,
}: {
  active?: boolean;
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
          ? "relative min-h-[180px] flex-1 rounded-md border border-[#444748] bg-[#2b2a2a] p-6"
          : "relative min-h-[180px] flex-1 rounded-md border border-[#2b2a2a] bg-[#e5e2e1] p-6"
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
        <Ionicons color={active ? "#e5e2e1" : "#F4F1EE"} name={icon} size={22} />
      </View>
      <View className="mt-4 flex-1 justify-end">
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
            ? "absolute right-6 top-6 h-3 w-3 rounded-full border border-[#e5e2e1] bg-[#e5e2e1]"
            : "absolute right-6 top-6 h-3 w-3 rounded-full border border-[#141313]"
        }
      />
    </Pressable>
  );
}

export default function EquipmentAccessRoute() {
  const { user } = useAuth();
  const [value, setValue] = useState<EquipmentValue | null>(null);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const v = draft?.equipmentAccess;
        if (v && OPTIONS.some((x) => x.value === v)) setValue(v as EquipmentValue);
      })
      .catch(() => {});
  }, []);

  const canContinue = useMemo(() => Boolean(value), [value]);

  const handleContinue = useCallback(async () => {
    if (!value) return;
    await mergeOnboardingDraft({ equipmentAccess: value });
    router.push("/(preauth-onboarding)/injuries-limitations");
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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 200 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-md gap-12 self-center" style={{ width: "100%" }}>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 06 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                86%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "86%" }} />
            </View>
          </View>

          <OnboardingQuestion>What equipment do you have?</OnboardingQuestion>

          <View className="flex-row flex-wrap gap-2">
            {OPTIONS.map((o) => (
              <View key={o.value} className="w-full md:w-1/2" style={{ width: "48%" }}>
                <EquipmentCard
                  active={value === o.value}
                  description={o.description}
                  icon={o.icon}
                  title={o.title}
                  onPress={() => setValue(o.value)}
                />
              </View>
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
