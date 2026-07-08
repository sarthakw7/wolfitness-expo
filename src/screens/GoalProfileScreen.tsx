import { router } from "expo-router";
import { memo, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { ModalSheet } from "@/src/components/layout";
import { AppButton, AppInput, Typography } from "@/src/components/primitives";
import { ActivityLevelPicker } from "@/src/features/user-goals/components/ActivityLevelPicker";
import { GoalTypePills } from "@/src/features/user-goals/components/GoalTypePills";
import { StickySaveBar } from "@/src/features/user-goals/components/StickySaveBar";
import { TargetGoalSuggestions } from "@/src/features/user-goals/components/TargetGoalSuggestions";
import { formatActivityLevelLabel, formatGoalTypeLabel, formatHeightCm, formatWeightKg } from "@/src/features/user-goals/constants";
import { parseOptionalPositiveNumber } from "@/src/features/user-goals/lib/goal-profile-validation";
import { useGoalProfileForm } from "@/src/features/user-goals/hooks/useGoalProfileForm";
import { useUpdateProfile } from "@/src/hooks/mutations";
import { useProfile } from "@/src/hooks/queries";
import { useAuth } from "@/src/hooks/useAuth";

function GoalProfileScreenComponent() {
  const { user } = useAuth();
  const profileQuery = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const form = useGoalProfileForm(profileQuery.data?.fitnessProfile ?? null, profileQuery.isLoading);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fitnessProfile = profileQuery.data?.fitnessProfile ?? null;
  const currentGoalType = formatGoalTypeLabel(fitnessProfile?.goal_type ?? fitnessProfile?.primary_goal);
  const currentActivityLevel = formatActivityLevelLabel(fitnessProfile?.activity_level);
  const currentTargetGoal = fitnessProfile?.target_goal?.trim() || null;

  const handleSave = async () => {
    if (!user?.id) return;
    if (form.weightError || form.heightError) return;

    if (!form.selectedGoalType || !form.activityLevel) {
      Alert.alert("Missing information", "Choose a goal type and activity level before saving.");
      return;
    }

    const nextWeight = parseOptionalPositiveNumber(form.weightKg);
    const nextHeight = parseOptionalPositiveNumber(form.heightCm);
    const nextTargetGoal = form.targetGoal.trim() || null;
    setSaveError(null);

    try {
      await updateProfileMutation.mutateAsync({
        activityLevel: form.activityLevel,
        goalType: form.selectedGoalType,
        heightCm: nextHeight,
        primaryGoal: form.selectedGoalType,
        targetGoal: nextTargetGoal,
        weightKg: nextWeight,
      });

      Alert.alert("Goal profile updated", "Your goal profile has been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save goal profile.";
      setSaveError(message);
      Alert.alert("Unable to save goal profile", message);
    }
  };

  if (profileQuery.error) {
    return (
      <ModalSheet eyebrow="Profile" title="Goal Profile">
        <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load goal profile</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
          <AppButton onPress={() => profileQuery.refetch()} variant="secondary">
            Retry
          </AppButton>
        </View>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      eyebrow="Profile"
      footer={<StickySaveBar disabled={!form.canSave} isSaving={updateProfileMutation.isPending} onSave={handleSave} />}
      title="Goal Profile"
    >
      {profileQuery.isLoading && !form.hydrated ? (
        <View className="items-center justify-center rounded-2xl border border-border bg-surface-raised py-10">
          <ActivityIndicator />
        </View>
      ) : null}

      <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Goal Profile</Typography>
        <Typography tone="secondary" variant="bodyMd">
          Keep your training direction, baseline, and target outcome up to date.
        </Typography>
      </View>

      <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <AppInput
              keyboardType="decimal-pad"
              label="Weight (kg)"
              onChangeText={(text) => {
                setSaveError(null);
                form.setWeightKg(text);
              }}
              placeholder="82"
              value={form.weightKg}
              error={form.weightError ?? undefined}
            />
          </View>
          <View className="flex-1">
            <AppInput
              keyboardType="decimal-pad"
              label="Height (cm)"
              onChangeText={(text) => {
                setSaveError(null);
                form.setHeightCm(text);
              }}
              placeholder="178"
              value={form.heightCm}
              error={form.heightError ?? undefined}
            />
          </View>
        </View>

        <GoalTypePills
          label="Goal type"
          onChange={(next) => {
            setSaveError(null);
            form.setGoalType(next);
          }}
          value={form.goalType}
        />

        <AppInput
          label="Target goal"
          multiline
          numberOfLines={3}
          onChangeText={(text) => {
            setSaveError(null);
            form.setTargetGoal(text);
          }}
          placeholder="Tap a suggestion or write your own"
          textAlignVertical="top"
          value={form.targetGoal}
        />

        <TargetGoalSuggestions
          goalType={form.selectedGoalType}
          onSelect={(next) => {
            setSaveError(null);
            form.setTargetGoal(next);
          }}
          value={form.targetGoal}
        />

        <ActivityLevelPicker
          label="Activity level"
          onChange={(next) => {
            setSaveError(null);
            form.setActivityLevel(next);
          }}
          value={form.activityLevel}
        />
      </View>

      <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
        <Typography variant="headlineLg">Saved profile</Typography>
        <View className="gap-2">
          <Typography tone="secondary" variant="bodyMd">
            Goal type: {currentGoalType ?? "Not set"}
          </Typography>
          <Typography tone="secondary" variant="bodyMd">
            Activity level: {currentActivityLevel ?? "Not set"}
          </Typography>
          <Typography tone="secondary" variant="bodyMd">
            Baseline: {formatWeightKg(fitnessProfile?.weight_kg)} · {formatHeightCm(fitnessProfile?.height_cm)}
          </Typography>
          <Typography tone="secondary" variant="bodyMd">
            Target goal: {currentTargetGoal ?? "Not set"}
          </Typography>
        </View>
      </View>

      {saveError ? (
        <Typography tone="danger" variant="labelSm">
          {saveError}
        </Typography>
      ) : null}
    </ModalSheet>
  );
}

export const GoalProfileScreen = memo(GoalProfileScreenComponent);
