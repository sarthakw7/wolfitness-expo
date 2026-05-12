import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo } from "react";
import { Image, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold, SectionTitle, StatCard } from "@/src/components/layout";
import { ProgramCard } from "@/src/components/marketplace";
import { Typography } from "@/src/components/primitives";
import {
  marketplaceCoaches,
  marketplacePrograms,
} from "@/src/constants/marketplace";
import { colors } from "@/src/theme";

function CoachDetailScreenComponent() {
  const params = useLocalSearchParams<{ coachId?: string }>();
  const coach =
    marketplaceCoaches.find((item) => item.id === params.coachId) ??
    marketplaceCoaches[0];
  const programs = marketplacePrograms.filter((program) => program.coach === coach.name);
  const displayPrograms = programs.length > 0 ? programs : marketplacePrograms.slice(0, 2);

  return (
    <ScreenScaffold bottomChrome="none" header={<AppTopBar back title="Coach" />}>
      <View className="items-center gap-5">
        <View className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-surface-muted">
          <Image source={{ uri: coach.image }} style={{ height: "100%", width: "100%" }} />
        </View>
        <View className="items-center gap-2">
          <Typography align="center" variant="displayLg">
            {coach.name}
          </Typography>
          <Typography align="center" tone="accent" variant="labelMd">
            {coach.discipline}
          </Typography>
          <Typography align="center" tone="secondary" variant="bodyLg">
            {coach.signal}
          </Typography>
        </View>
      </View>

      <View className="flex-row gap-gutter">
        <StatCard className="flex-1" label="Blocks" value="12" />
        <StatCard className="flex-1" label="Focus" value="Elite" />
      </View>

      <EditorialCard className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-soft">
            <Ionicons color={colors.emeraldDeep} name="sparkles-outline" size={18} />
          </View>
          <View className="flex-1">
            <Typography variant="headlineLg">Coaching Philosophy</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Quietly rigorous programming with clear weekly intent, measurable adaptation, and minimal noise.
            </Typography>
          </View>
        </View>
      </EditorialCard>

      <View className="gap-4">
        <SectionTitle title="Programs By Coach" />
        {displayPrograms.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </View>
    </ScreenScaffold>
  );
}

export const CoachDetailScreen = memo(CoachDetailScreenComponent);
