import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { Image, type ImageSourcePropType, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useMacroTargets, useProfile } from "@/src/hooks/queries";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const fallbackAvatar = require("@/assets/images/landing.png");

function titleCase(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

function formatLbs(weightKg: number) {
  const lbs = weightKg * 2.2046226218;
  return Math.round(lbs).toString();
}

function fallbackDisplayName(email?: string | null) {
  if (!email) return "Athlete";
  const local = email.split("@")[0];
  if (!local) return "Athlete";
  return titleCase(local.replace(/[._-]+/g, " "));
}

function AthleteProfileScreenComponent() {
  const { signOut, user } = useAuth();
  const profileQuery = useProfile();
  const macroTargetsQuery = useMacroTargets();

  useEffect(() => {
    if (profileQuery.error) {
      console.warn("[athlete-flow]", {
        error: profileQuery.error instanceof Error ? profileQuery.error.message : String(profileQuery.error),
        screen: "AthleteProfile",
        type: "profile",
      });
    }
  }, [profileQuery.error]);

  useEffect(() => {
    if (macroTargetsQuery.error) {
      console.warn("[nutrition]", {
        error: macroTargetsQuery.error instanceof Error ? macroTargetsQuery.error.message : String(macroTargetsQuery.error),
        screen: "AthleteProfile",
        type: "macro-targets",
      });
    }
  }, [macroTargetsQuery.error]);

  const publicProfile = profileQuery.data?.publicProfile ?? null;
  const fitnessProfile = profileQuery.data?.fitnessProfile ?? null;
  const isProfileBundleMissing = !profileQuery.isLoading && !profileQuery.error && !publicProfile && !fitnessProfile;

  const displayName = useMemo(() => {
    const name =
      publicProfile?.full_name ??
      publicProfile?.username ??
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      null;
    return name && name.trim().length > 0 ? name : fallbackDisplayName(user?.email ?? publicProfile?.email);
  }, [publicProfile?.full_name, publicProfile?.username, user?.email, user?.user_metadata, publicProfile?.email]);

  const avatarSource: ImageSourcePropType = useMemo(() => {
    const uri =
      publicProfile?.avatar_url ??
      (user?.user_metadata?.avatar_url as string | undefined) ??
      (user?.user_metadata?.picture as string | undefined) ??
      null;
    return uri ? { uri } : fallbackAvatar;
  }, [publicProfile?.avatar_url, user?.user_metadata]);

  const chips = useMemo(() => {
    const vibe = fitnessProfile?.vibe_type ? titleCase(fitnessProfile.vibe_type) : null;
    const experience = fitnessProfile?.experience_level ? titleCase(fitnessProfile.experience_level) : null;
    const role = publicProfile?.role ? titleCase(publicProfile.role) : null;

    const primary = experience ?? role ?? "Athlete";
    const secondary = vibe ?? null;

    return { primary, secondary };
  }, [fitnessProfile?.vibe_type, fitnessProfile?.experience_level, publicProfile?.role]);

  const statWeight = useMemo(() => {
    if (typeof fitnessProfile?.weight_kg !== "number") {
      return { value: "--", unit: "lbs" };
    }
    return { value: formatLbs(fitnessProfile.weight_kg), unit: "lbs" };
  }, [fitnessProfile?.weight_kg]);

  const macroTargets = macroTargetsQuery.data ?? null;

  function ProfileStatCard({
    icon,
    label,
    meta,
    tone = "neutral",
    trend,
    unit,
    value,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    unit?: string;
    trend?: string;
    meta?: string;
    tone?: "neutral" | "accent";
  }) {
    const iconColor = tone === "accent" ? colors.emerald : colors.emerald;
    const trendColor = colors.emeraldDeep;

    return (
      <EditorialCard className="flex-1 aspect-square justify-between rounded-xl p-6">
        <View className="flex-row items-start justify-between">
          <Typography
            className="uppercase tracking-widest"
            tone="secondary"
            variant="labelSm"
          >
            {label}
          </Typography>
          <Ionicons color={iconColor} name={icon} size={22} />
        </View>

        <View>
          <View className="flex-row flex-wrap items-baseline gap-2">
            <Typography variant="headlineXl">{value}</Typography>
            {unit ? (
              <Typography className="pb-1" tone="secondary" variant="bodyMd">
                {unit}
              </Typography>
            ) : null}
          </View>

          {trend ? (
            <Typography className="mt-2" style={{ color: trendColor }} variant="labelSm">
              {trend}
            </Typography>
          ) : null}

          {meta ? (
            <Typography className="mt-2" tone="secondary" variant="labelSm">
              {meta}
            </Typography>
          ) : null}
        </View>
      </EditorialCard>
    );
  }

  if (profileQuery.error) {
    return (
      <ScreenScaffold contentClassName="gap-6" header={<AppTopBar centered title="Wolfitness" />}>
        <View className="gap-6 px-2">
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load profile</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Please try again in a moment.
            </Typography>
            <AppButton onPress={() => profileQuery.refetch()} variant="secondary">
              Retry
            </AppButton>
          </EditorialCard>
        </View>
      </ScreenScaffold>
    );
  }

  if (isProfileBundleMissing) {
    return (
      <ScreenScaffold contentClassName="gap-6" header={<AppTopBar centered title="Wolfitness" />}>
        <View className="gap-6 px-2">
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Complete Athlete Setup</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Your athlete profile is incomplete. Add baseline details so the app can personalize your training flow.
            </Typography>
            <AppButton onPress={() => router.push("/(modals)/edit-profile")} variant="secondary">
              Go To Profile Setup
            </AppButton>
          </EditorialCard>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold contentClassName="gap-6" header={<AppTopBar centered title="Wolfitness" />}>
      <View className="gap-6 px-2">
      <View className="items-center gap-6 pt-4">
        <View className="relative items-center justify-center">
          {/* soft background glow (approx the radial wash from the HTML) */}
          <View
            className="absolute rounded-full"
            style={{
              backgroundColor: colors.emeraldSoft,
              height: 320,
              opacity: 0.35,
              width: 320,
            }}
          />
          <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-surface-muted">
            <View className="h-full w-full">
              <Image accessibilityLabel="Athlete profile" source={avatarSource} style={{ height: "100%", width: "100%" }} />
            </View>
          </View>
        </View>

        <View className="items-center gap-3">
          <Typography align="center" variant="displayLg">
            {displayName}
          </Typography>
          <View className="flex-row gap-2">
            <Chip active label={chips.primary} />
            {chips.secondary ? <Chip label={chips.secondary} /> : null}
          </View>
          <View className="mt-2 w-full max-w-[220px]">
            <AppButton onPress={() => router.push("/(modals)/edit-profile")} size="sm" variant="ghost">
              Edit Profile
            </AppButton>
          </View>
        </View>
      </View>

      <View className="gap-4">
        <View className="flex-row items-end justify-between">
          <Typography variant="headlineLg">Biometrics</Typography>
          <Typography className="uppercase tracking-widest" tone="accent" variant="labelSm">
            Update
          </Typography>
        </View>
        <View className="flex-row gap-gutter">
          <ProfileStatCard
            icon="scale-outline"
            label="Weight"
            trend={statWeight.value === "--" ? undefined : "\u2193 1.2 lbs"}
            unit={statWeight.unit}
            value={statWeight.value}
          />
          <ProfileStatCard
            icon="pulse-outline"
            label="Body Fat"
            meta="Optimal Range"
            unit="%"
            value="--"
          />
        </View>
        <View className="flex-row gap-gutter">
          <ProfileStatCard
            icon="heart-outline"
            label="Resting HR"
            meta="Top 5%"
            unit="bpm"
            value="--"
          />
          <ProfileStatCard
            icon="leaf-outline"
            label="VO2 Max"
            trend={"\u2191 0.4"}
            unit="ml/kg/min"
            value="--"
          />
        </View>
      </View>

      <View className="gap-4">
        <View className="flex-row items-end justify-between">
          <Typography variant="headlineLg">Nutrition Goals</Typography>
          <AppButton onPress={() => router.push("/(modals)/nutrition-goals")} size="sm" variant="ghost">
            {macroTargets ? "Edit Goals" : "Set Goals"}
          </AppButton>
        </View>

        {!macroTargets ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Set Nutrition Goals</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Add your daily calorie and macro targets so nutrition progress can track against your plan.
            </Typography>
            <AppButton onPress={() => router.push("/(modals)/nutrition-goals")} variant="secondary">
              Set Nutrition Goals
            </AppButton>
          </EditorialCard>
        ) : (
          <View className="gap-gutter">
            <View className="flex-row gap-gutter">
              <ProfileStatCard
                icon="flame-outline"
                label="Calories"
                unit="kcal"
                value={macroTargets.daily_calorie_target.toString()}
              />
              <ProfileStatCard
                icon="barbell-outline"
                label="Protein"
                unit="g"
                value={macroTargets.daily_protein_target.toString()}
              />
            </View>
            <View className="flex-row gap-gutter">
              <ProfileStatCard
                icon="nutrition-outline"
                label="Carbs"
                unit="g"
                value={macroTargets.daily_carbs_target.toString()}
              />
              <ProfileStatCard
                icon="water-outline"
                label="Fat"
                unit="g"
                value={macroTargets.daily_fat_target.toString()}
              />
            </View>
          </View>
        )}
      </View>

      <View className="w-full max-w-md self-center pt-2" style={{ width: "100%" }}>
        <AppButton
          className="w-full"
          iconLeft={<Ionicons color={colors.graphite} name="log-out-outline" size={18} />}
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          }}
          size="md"
          style={{
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.borderStrong,
            // Android shadow
            elevation: 10,
            // iOS shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 18,
          }}
          variant="ghost"
        >
          Sign Out
        </AppButton>
      </View>
      </View>

    </ScreenScaffold>
  );
}

export const AthleteProfileScreen = memo(AthleteProfileScreenComponent);
