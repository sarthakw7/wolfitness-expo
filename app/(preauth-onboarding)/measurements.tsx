import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";
import { spacing, typography } from "@/src/theme";

import { OnboardingQuestion, OnboardingSubtext } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

function onlyNumber(value: string) {
  return value.replace(/[^\d.]/g, "");
}

type HeightUnit = "cm" | "ftin";
type WeightUnit = "kg" | "lb";

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function kgFromLb(lb: number) {
  return lb / 2.2046226218;
}

function lbFromKg(kg: number) {
  return kg * 2.2046226218;
}

function cmFromFtIn(ft: number, inch: number) {
  return (ft * 12 + inch) * 2.54;
}

function ftInFromCm(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  // Normalize rounding edge cases (e.g. 5ft 12in => 6ft 0in)
  if (inch >= 12) return { ft: ft + 1, inch: 0 };
  if (inch < 0) return { ft: Math.max(0, ft - 1), inch: 11 };
  return { ft, inch };
}

function Segmented2({
  left,
  right,
  value,
  onChange,
}: {
  left: { label: string; value: string };
  right: { label: string; value: string };
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row overflow-hidden rounded-full border border-[#353434]">
      <Pressable
        accessibilityRole="button"
        className={value === left.value ? "flex-1 bg-[#2b2a2a] px-3 py-2.5" : "flex-1 bg-transparent px-3 py-2.5"}
        onPress={() => onChange(left.value)}
        style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
      >
        <Typography
          align="center"
          allowFontScaling={false}
          numberOfLines={1}
          style={{ color: value === left.value ? "#F4F1EE" : "#C4C7C7" }}
          variant="labelSm"
        >
          {left.label}
        </Typography>
      </Pressable>
      <View className="w-px bg-[#353434]" />
      <Pressable
        accessibilityRole="button"
        className={value === right.value ? "flex-1 bg-[#2b2a2a] px-3 py-2.5" : "flex-1 bg-transparent px-3 py-2.5"}
        onPress={() => onChange(right.value)}
        style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
      >
        <Typography
          align="center"
          allowFontScaling={false}
          numberOfLines={1}
          style={{ color: value === right.value ? "#F4F1EE" : "#C4C7C7" }}
          variant="labelSm"
        >
          {right.label}
        </Typography>
      </Pressable>
    </View>
  );
}

export default function MeasurementsRoute() {
  const { user } = useAuth();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLb, setWeightLb] = useState("");

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        if (draft?.heightCm) setHeightCm(String(draft.heightCm));
        if (draft?.weightKg) setWeightKg(String(draft.weightKg));
      })
      .catch(() => {});
  }, []);

  const canonicalHeightCm = useMemo(() => {
    if (heightUnit === "cm") return Number(heightCm);
    const ft = Number(heightFt);
    const inch = clampInt(Number(heightIn || "0"), 0, 11);
    if (!ft) return 0;
    return cmFromFtIn(ft, inch);
  }, [heightCm, heightFt, heightIn, heightUnit]);

  const canonicalWeightKg = useMemo(() => {
    if (weightUnit === "kg") return Number(weightKg);
    const lb = Number(weightLb);
    if (!lb) return 0;
    return kgFromLb(lb);
  }, [weightKg, weightLb, weightUnit]);

  const canContinue = Boolean(canonicalHeightCm > 0 && canonicalWeightKg > 0);

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;
    await mergeOnboardingDraft({ heightCm: canonicalHeightCm, weightKg: canonicalWeightKg });
    router.push("/(preauth-onboarding)/primary-goal");
  }, [canContinue, canonicalHeightCm, canonicalWeightKg]);

  const switchHeightUnit = useCallback(
    (next: HeightUnit) => {
      if (next === heightUnit) return;
      const curCm = canonicalHeightCm;
      setHeightUnit(next);
      if (curCm > 0) {
        if (next === "cm") {
          setHeightCm(String(Math.round(curCm)));
        } else {
          const { ft, inch } = ftInFromCm(curCm);
          setHeightFt(String(ft));
          setHeightIn(String(inch));
        }
      }
    },
    [canonicalHeightCm, heightUnit],
  );

  const switchWeightUnit = useCallback(
    (next: WeightUnit) => {
      if (next === weightUnit) return;
      const curKg = canonicalWeightKg;
      setWeightUnit(next);
      if (curKg > 0) {
        if (next === "kg") {
          setWeightKg(String(Math.round(curKg * 10) / 10));
        } else {
          setWeightLb(String(Math.round(lbFromKg(curKg) * 10) / 10));
        }
      }
    },
    [canonicalWeightKg, weightUnit],
  );

  const cardInputStyle = {
    backgroundColor: "transparent",
    borderBottomColor: "#353434",
    borderBottomWidth: 1,
    color: "#141313",
    // Use system font for these big numeric inputs. Some Android OEM builds render
    // custom font + large size + light weights too faint (or effectively invisible).
    fontFamily: undefined as unknown as string,
    fontSize: 32,
    fontWeight: "600" as const,
    paddingBottom: spacing[1],
    textAlign: "center" as const,
    width: 120,
  };

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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 120 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-md gap-12 self-center" style={{ width: "100%" }}>
          {/* Step + Progress (match biological-sex layout) */}
          <View className="w-full flex flex-col gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 03 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                43%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "43%" }} />
            </View>
          </View>

          <View className="items-center gap-3">
            <OnboardingQuestion align="center">What are your measurements?</OnboardingQuestion>
            <OnboardingSubtext align="center">
              Establishing your baseline physical metrics ensures personalized threshold calculations and accurate metabolic tracking.
            </OnboardingSubtext>
          </View>

          <View className="flex-row flex-wrap justify-center gap-6">
            <View className="min-w-[160px] flex-1 items-center justify-center rounded-xl border border-[#353434] p-6">
              <Typography className="tracking-[3px] text-[#C4C7C7]" variant="labelSm">
                HEIGHT
              </Typography>
              <View className="mt-4 w-full">
                <Segmented2
                  left={{ label: "cm", value: "cm" }}
                  right={{ label: "ft/in", value: "ftin" }}
                  value={heightUnit}
                  onChange={(v) => switchHeightUnit(v as HeightUnit)}
                />
              </View>
              <View className="mt-4 flex-row items-end">
                {heightUnit === "cm" ? (
                  <>
                    <TextInput
                      inputMode="numeric"
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#353434"
                      selectionColor="#141313"
                      style={cardInputStyle}
                      value={heightCm}
                      onChangeText={(t) => setHeightCm(onlyNumber(t))}
                    />
                    <Typography className="ml-2 text-[#C4C7C7]" variant="labelSm">
                      cm
                    </Typography>
                  </>
                ) : (
                  <View className="flex-row items-end gap-3">
                    <View className="items-center">
                      <TextInput
                        inputMode="numeric"
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#353434"
                        selectionColor="#141313"
                        style={{ ...cardInputStyle, width: 70 }}
                        value={heightFt}
                        onChangeText={(t) => setHeightFt(onlyNumber(t))}
                      />
                      <Typography className="mt-2 text-[#C4C7C7]" variant="labelSm">
                        ft
                      </Typography>
                    </View>
                    <View className="items-center">
                      <TextInput
                        inputMode="numeric"
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#353434"
                        selectionColor="#141313"
                        style={{ ...cardInputStyle, width: 70 }}
                        value={heightIn}
                        onChangeText={(t) => setHeightIn(onlyNumber(t))}
                      />
                      <Typography className="mt-2 text-[#C4C7C7]" variant="labelSm">
                        in
                      </Typography>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="min-w-[160px] flex-1 items-center justify-center rounded-xl border border-[#353434] p-6">
              <Typography className="tracking-[3px] text-[#C4C7C7]" variant="labelSm">
                WEIGHT
              </Typography>
              <View className="mt-4 w-full">
                <Segmented2
                  left={{ label: "kg", value: "kg" }}
                  right={{ label: "lb", value: "lb" }}
                  value={weightUnit}
                  onChange={(v) => switchWeightUnit(v as WeightUnit)}
                />
              </View>
              <View className="mt-4 flex-row items-end">
                {weightUnit === "kg" ? (
                  <>
                    <TextInput
                      inputMode="numeric"
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#353434"
                      selectionColor="#141313"
                      style={cardInputStyle}
                      value={weightKg}
                      onChangeText={(t) => setWeightKg(onlyNumber(t))}
                    />
                    <Typography className="ml-2 text-[#C4C7C7]" variant="labelSm">
                      kg
                    </Typography>
                  </>
                ) : (
                  <>
                    <TextInput
                      inputMode="numeric"
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#353434"
                      selectionColor="#141313"
                      style={cardInputStyle}
                      value={weightLb}
                      onChangeText={(t) => setWeightLb(onlyNumber(t))}
                    />
                    <Typography className="ml-2 text-[#C4C7C7]" variant="labelSm">
                      lb
                    </Typography>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScreenContainer>

      <View className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <OnboardingContinueButton disabled={!canContinue} onPress={handleContinue} />
      </View>
    </View>
  );
}
