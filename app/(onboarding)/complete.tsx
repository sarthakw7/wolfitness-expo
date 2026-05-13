import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ImageBackground, View } from "react-native";
import * as Haptics from "expo-haptics";

import {
  AppButton,
  GlassCard,
  ScreenContainer,
  Typography,
} from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const completeImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop";

export default function CompleteRoute() {
  const { completeOnboarding, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSubmitting(true);
    await completeOnboarding();
    setIsSubmitting(false);
    router.replace("/(tabs)");
  }, [completeOnboarding]);

  return (
    <View className="flex-1 bg-surface">
      <View className="absolute inset-0 bg-black">
        <ImageBackground
          accessibilityLabel="Minimalist gym background"
          source={{ uri: completeImage }}
          style={{ height: "100%", width: "100%", opacity: 0.8 }}
        />
        <View className="absolute inset-0 bg-black/40" />
      </View>

      <ScreenContainer
        className="bg-transparent"
        contentClassName="flex-grow justify-end pb-12"
      >
        <GlassCard className="gap-6 p-8" intensity={30} tier="floating">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald/20 border border-emerald">
              <Ionicons
                color={colors.emeraldDeep}
                name="shield-checkmark"
                size={28}
              />
            </View>
            <View className="flex-1">
              <Typography tone="secondary" variant="labelSm" className="uppercase tracking-widest">
                Athlete Identified
              </Typography>
              <Typography variant="headlineXl">Session Secured</Typography>
            </View>
          </View>

          <View className="gap-2">
            <Typography variant="headlineLg">System Calibrated</Typography>
            <Typography tone="secondary" variant="bodyLg">
              Welcome, {user?.email?.split("@")[0] ?? "Athlete"}. Your environment is ready. Enter the protocol.
            </Typography>
          </View>

          <AppButton
            isLoading={isSubmitting}
            onPress={handleContinue}
            size="lg"
            variant="secondary"
          >
            {isSubmitting ? "Generating Workspace..." : "Enter OS"}
          </AppButton>
        </GlassCard>
      </ScreenContainer>
    </View>
  );
}
