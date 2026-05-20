import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";

import { OnboardingQuestion } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoFromDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function toDisplayMMDDYYYY(date: Date) {
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function DateOfBirthRoute() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        if (!draft?.dateOfBirth) return;
        const [y, m, d] = draft.dateOfBirth.split("-");
        const yyyy = Number(y);
        const mm = Number(m);
        const dd = Number(d);
        if (!yyyy || !mm || !dd) return;
        const candidate = new Date(yyyy, mm - 1, dd);
        if (Number.isNaN(candidate.getTime())) return;
        setDate(candidate);
      })
      .catch(() => {});
  }, []);

  const iso = useMemo(() => (date ? toIsoFromDate(date) : null), [date]);

  const handleContinue = useCallback(async () => {
    if (!iso) return;
    await mergeOnboardingDraft({ dateOfBirth: iso });
    router.push("/(preauth-onboarding)/measurements");
  }, [iso]);

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
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 48, paddingBottom: 48 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-lg self-center" style={{ width: "100%" }}>
          <View className="mb-12 gap-2">
            <View className="flex-row items-center justify-between">
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                STEP 02 OF 07
              </Typography>
              <Typography className="tracking-[2px] text-[#C4C7C7]" variant="labelSm">
                29%
              </Typography>
            </View>
            <View className="h-[2px] w-full overflow-hidden rounded-full bg-[#242424]">
              <View className="h-full rounded-full bg-[#c8c6c5]" style={{ width: "29%" }} />
            </View>
          </View>

          <OnboardingQuestion align="center">When is your birthday?</OnboardingQuestion>

          <View className="mt-12">
            <Pressable
              accessibilityRole="button"
              className="w-full rounded-lg border border-[#353434] bg-transparent px-5 py-5"
              onPress={() => setShowPicker(true)}
              style={({ pressed }) => (pressed ? { opacity: 0.92 } : null)}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Typography className="tracking-[3px] text-[#C4C7C7]" variant="labelSm">
                    DATE
                  </Typography>
                  <View className="h-2" />
                  <Typography className="text-[#F4F1EE]" variant="headlineXl">
                    {date ? toDisplayMMDDYYYY(date) : "MM/DD/YYYY"}
                  </Typography>
                </View>
                <Ionicons color="#C4C7C7" name="calendar-outline" size={22} />
              </View>
            </Pressable>

            {showPicker ? (
              <DateTimePicker
                display={Platform.OS === "android" ? "calendar" : "spinner"}
                maximumDate={new Date()}
                mode="date"
                value={date ?? new Date(2000, 0, 1)}
                onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                  if (Platform.OS === "android") setShowPicker(false);
                  if (event.type === "dismissed") return;
                  if (!selectedDate) return;
                  setDate(selectedDate);
                }}
              />
            ) : null}
          </View>

          <View className="mt-16 items-center">
            <OnboardingContinueButton
              disabled={!iso}
              onPress={handleContinue}
              style={{ maxWidth: 360 }}
            />
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}
