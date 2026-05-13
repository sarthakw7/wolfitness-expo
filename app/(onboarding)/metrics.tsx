import { router } from "expo-router";
import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import * as Haptics from "expo-haptics";

import {
  AppButton,
  AppInput,
  ScreenContainer,
  Typography,
} from "@/src/components/primitives";

export default function MetricsRoute() {
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/complete");
  };

  const isComplete = age.trim() !== "" && height.trim() !== "" && weight.trim() !== "";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-surface">
      <ScreenContainer scroll contentClassName="flex-grow pt-12 pb-4 gap-10">
        <View className="gap-2 px-2 pt-12">
          <Typography tone="secondary" variant="labelSm" className="uppercase tracking-widest">
            Phase 3 / 3
          </Typography>
          <Typography variant="displaySm">Biometrics</Typography>
          <Typography tone="secondary" variant="bodyLg">
            Provide baseline data to calibrate the system.
          </Typography>
        </View>

        <View className="gap-8 flex-1 px-2 pt-4">
          <AppInput
            label="Age"
            placeholder="Years"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />
          <AppInput
            label="Height"
            placeholder="cm"
            keyboardType="number-pad"
            value={height}
            onChangeText={setHeight}
          />
          <AppInput
            label="Current Weight"
            placeholder="kg"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </ScreenContainer>
      
      <View className="px-4 pb-12 pt-4 bg-surface">
        <AppButton size="lg" disabled={!isComplete} onPress={handleContinue}>
          Finalize Calibration
        </AppButton>
      </View>
    </KeyboardAvoidingView>
  );
}
