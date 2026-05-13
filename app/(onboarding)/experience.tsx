import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";

import {
  AppButton,
  ScreenContainer,
  Typography,
} from "@/src/components/primitives";
import { colors } from "@/src/theme";

const EXPERIENCES = [
  { id: "beginner", label: "Beginner", description: "0-1 years of structured training." },
  { id: "intermediate", label: "Intermediate", description: "1-3 years of consistent progression." },
  { id: "advanced", label: "Advanced", description: "3+ years of dedicated athletic training." },
];

export default function ExperienceRoute() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(onboarding)/metrics");
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenContainer scroll contentClassName="flex-grow pt-12 pb-4 gap-10">
        <View className="gap-2 px-2 pt-12">
          <Typography tone="secondary" variant="labelSm" className="uppercase tracking-widest">
            Phase 2 / 3
          </Typography>
          <Typography variant="displaySm">Training Age</Typography>
          <Typography tone="secondary" variant="bodyLg">
            Establish your current baseline experience.
          </Typography>
        </View>

        <View className="gap-4 flex-1">
          {EXPERIENCES.map((exp) => {
            const isSelected = selected === exp.id;
            return (
              <Pressable
                key={exp.id}
                onPress={() => handleSelect(exp.id)}
                className={`p-5 rounded-2xl border ${isSelected ? "border-emerald bg-surface-raised" : "border-border bg-transparent"}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 gap-1">
                    <Typography variant="headlineMd" tone={isSelected ? "primary" : "secondary"}>{exp.label}</Typography>
                    <Typography variant="bodyMd" tone="secondary">{exp.description}</Typography>
                  </View>
                  <View className={`h-6 w-6 rounded-full border items-center justify-center ${isSelected ? "border-emerald bg-emerald/10" : "border-border"}`}>
                    {isSelected && <Ionicons name="checkmark" size={16} color={colors.emerald} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScreenContainer>
      
      <View className="px-4 pb-12 pt-4 bg-surface">
        <AppButton size="lg" disabled={!selected} onPress={handleContinue}>
          Confirm Experience
        </AppButton>
      </View>
    </View>
  );
}
