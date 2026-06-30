import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { commitOnboardingDraftToSupabase } from "@/src/lib/commit-onboarding-draft";
import { mergeOnboardingDraft, readOnboardingDraft } from "@/src/lib/onboarding-draft";
import { computeVibeFromDraft, type VibeMetrics, type VibeType } from "@/src/lib/onboarding-score";

import { OnboardingSubtext } from "@/src/components/onboarding/OnboardingCopy";
import { OnboardingContinueButton } from "@/src/components/onboarding/OnboardingContinueButton";

function debugOnboarding(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

function clamp0_100(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function MetricCard({ label, value }: { label: string; value: number }) {
  const pct = clamp0_100(value);
  return (
    <View className="flex-1 border border-[#444748] bg-[#2b2a2a] p-6">
      <Typography
        tone="inverse"
        style={{ color: "#F4F1EE", textTransform: "uppercase", fontFamily: undefined, fontWeight: "600" }}
        variant="labelSm"
      >
        {label}
      </Typography>
      <View className="h-4" />
      <Typography
        tone="inverse"
        style={{ color: "#F4F1EE", fontFamily: undefined, fontSize: 32, fontWeight: "700" }}
        variant="headlineLg"
      >
        {pct}
      </Typography>
      <View className="mt-4 h-[2px] w-full bg-[#353434]">
        <View className="h-full bg-[#c8c6c5]" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function AthleteVibeRevealRoute() {
  const { refreshOnboardingStatus, user } = useAuth();
  const [vibe, setVibe] = useState<VibeType>("balanced");
  const [metrics, setMetrics] = useState<VibeMetrics>({ power: 50, endurance: 50, mobility: 50 });

  useEffect(() => {
    readOnboardingDraft()
      .then((draft) => {
        const result = computeVibeFromDraft(draft ?? {});
        setVibe(result.vibeType);
        setMetrics(result.metrics);
        // Persist computed values for post-auth commit.
        mergeOnboardingDraft({ vibeType: result.vibeType, vibeMetrics: result.metrics }).catch(() => {});
      })
      .catch(() => {});
  }, []);

  const { title, subtitle } = useMemo(() => {
    if (vibe === "power") return { title: "POWER", subtitle: "You thrive under heavy loads and explosive intent." };
    if (vibe === "endurance") return { title: "ENDURANCE", subtitle: "You excel at sustained output and efficient pacing." };
    if (vibe === "mobility") return { title: "MOBILITY", subtitle: "You build strength through range, control, and resilience." };
    return { title: "BALANCED", subtitle: "You master the harmony between explosive power and mindful recovery." };
  }, [vibe]);

  const handleContinue = useCallback(async () => {
    // If already authenticated (e.g. Google sign-in), finalize onboarding in-place.
    if (user?.id) {
      debugOnboarding("onboarding completion start", { userId: user.id });
      try {
        await commitOnboardingDraftToSupabase(user.id);
        await refreshOnboardingStatus();
        debugOnboarding("onboarding completion route", {
          navigationTarget: "/(tabs)",
          userId: user.id,
        });
        router.replace("/(tabs)");
      } catch (error) {
        console.warn("[auth-debug] onboarding completion failed", {
          error: error instanceof Error ? error.message : String(error),
          userId: user.id,
        });
      }
      return;
    }

    debugOnboarding("onboarding preauth route", {
      navigationTarget: "/(auth)/sign-up",
    });
    router.replace("/(auth)/sign-up");
  }, [refreshOnboardingStatus, user?.id]);

  const handleSkip = useCallback(() => {
    debugOnboarding("onboarding skip route", {
      navigationTarget: user?.id ? "/(tabs)" : "/(auth)/sign-up",
      userId: user?.id ?? null,
    });
    router.replace(user?.id ? "/(tabs)" : "/(auth)/sign-up");
  }, [user?.id]);

  return (
    <View className="flex-1 bg-[#141313]">
      <View className="h-16 w-full flex-row items-center justify-between border-b border-[#353434] px-8">
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
          <Ionicons color="#e5e2e1" name="arrow-back" size={20} />
        </Pressable>
        <Typography className="tracking-[3px] text-[#F4F1EE]" variant="labelSm">
          CALIBRATION
        </Typography>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={handleSkip}>
          <Typography className="tracking-[2px] text-[#F4F1EE]" variant="labelSm">
            SKIP
          </Typography>
        </Pressable>
      </View>

      <ScreenContainer
        scroll
        className="bg-[#141313]"
        contentClassName="flex-grow px-0 py-0"
        contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 48, paddingBottom: 80 }}
        edges={{ top: false, bottom: true }}
      >
        <View className="w-full max-w-2xl self-center items-center" style={{ width: "100%" }}>
          <View className="items-center gap-3">
            <Typography className="tracking-[4px] text-[#C4C7C7]" style={{ textTransform: "uppercase" }} variant="labelSm">
              YOUR ATHLETIC DNA
            </Typography>
            <Typography className="text-[#F4F1EE]" style={{ textTransform: "uppercase" }} variant="displayLg">
              {title}
            </Typography>
            <OnboardingSubtext align="center">
              {subtitle}
            </OnboardingSubtext>
          </View>

          <View className="h-10" />

          <View className="w-full gap-3">
            <View className="flex-row gap-3">
              <MetricCard label="Power" value={metrics.power} />
              <MetricCard label="Endurance" value={metrics.endurance} />
            </View>
            <MetricCard label="Mobility" value={metrics.mobility} />
          </View>

          <View className="h-10" />

          <OnboardingContinueButton label={user?.id ? "Enter OS" : "Continue to Sign Up"} onPress={handleContinue} />
        </View>
      </ScreenContainer>
    </View>
  );
}
