import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Image, View } from "react-native";

import { AppTopBar, Chip, ScreenScaffold, StatCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { colors } from "@/src/theme";

const profileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDngi4o0_hFh10NOFsd7Rkh-me5KI-DtKS-BNgMoXMley-EhG199ZRIPCLdn85m9xymE6pnjGvsfiAj-bgb60EVkSdokCOWBSmHBMpjvt3i8Jc89uUjTfBOeH7zevC-z9KxRaIpncPERYgjCtS8GQti49CkAumJ9qAPFDIPRrZc-Nl2b6afGHvE2h6DnzP70ngQrpzYpq5PL15DatIQhkcyHX-Dj9fJODLzI8fK1PtPwlCzVDM-A-VcL_yVWGtI4tbjNoKMGNG4ong6";

function AthleteProfileScreenComponent() {
  const { signOut, user } = useAuth();

  return (
    <ScreenScaffold header={<AppTopBar />}>
      <View className="items-center gap-5 pt-4">
        <View className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-surface-muted">
          <View className="h-full w-full">
            <Image accessibilityLabel="Athlete profile" source={{ uri: profileImage }} style={{ height: "100%", width: "100%" }} />
          </View>
        </View>
        <View className="items-center gap-3">
          <Typography align="center" variant="displayLg">
            Elias Thorne
          </Typography>
          <View className="flex-row gap-2">
            <Chip active label="Elite Athlete" />
            <Chip label="Pro Member" />
          </View>
        </View>
      </View>

      <View className="gap-4">
        <View className="flex-row items-end justify-between">
          <Typography variant="headlineLg">Biometrics</Typography>
          <Typography tone="accent" variant="labelSm">Update</Typography>
        </View>
        <View className="flex-row gap-gutter">
          <StatCard className="flex-1 aspect-square" icon="scale-outline" label="Weight" trend="1.2 lbs" unit="lbs" value="172" />
          <StatCard className="flex-1 aspect-square" icon="heart-outline" label="Resting HR" trend="Top 5%" unit="bpm" value="48" />
        </View>
        <View className="flex-row gap-gutter">
          <StatCard className="flex-1 aspect-square" icon="body-outline" label="Body Fat" trend="Optimal Range" unit="%" value="11.4" />
          <StatCard className="flex-1 aspect-square" icon="fitness-outline" label="VO2 Max" trend="+0.4" unit="ml/kg/min" value="56.2" />
        </View>
      </View>

      <View className="rounded-2xl border border-border bg-surface-raised p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-soft">
            <Ionicons color={colors.emeraldDeep} name="shield-checkmark-outline" size={20} />
          </View>
          <View className="flex-1">
            <Typography variant="headlineLg">Athlete OS</Typography>
            <Typography tone="secondary" variant="bodyMd">
              {user?.email ?? "Profile architecture is ready for biometrics, settings, and membership state."}
            </Typography>
          </View>
        </View>
      </View>

      <AppButton
        onPress={async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        }}
        variant="ghost"
      >
        Sign Out
      </AppButton>
    </ScreenScaffold>
  );
}

export const AthleteProfileScreen = memo(AthleteProfileScreenComponent);
