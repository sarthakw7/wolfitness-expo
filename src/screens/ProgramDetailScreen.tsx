import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo } from "react";
import { ImageBackground, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import { CoachCard, PricingCard, ProgramCard } from "@/src/components/marketplace";
import { Typography } from "@/src/components/primitives";
import {
  marketplaceCoaches,
  marketplacePrograms,
} from "@/src/constants/marketplace";
import { colors } from "@/src/theme";

function ProgramDetailScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const program =
    marketplacePrograms.find((item) => item.id === params.programId) ??
    marketplacePrograms[0];
  const coach =
    marketplaceCoaches.find((item) => item.name === program.coach) ??
    marketplaceCoaches[0];
  const relatedPrograms = marketplacePrograms.filter((item) => item.id !== program.id).slice(0, 2);

  return (
    <ScreenScaffold bottomChrome="none" header={<AppTopBar back title="Program" />}>
      <View className="min-h-[440px] overflow-hidden rounded-3xl bg-surface-muted shadow-luxury">
        <ImageBackground
          accessibilityLabel="Program hero image"
          source={{ uri: program.image }}
          style={{ flex: 1, justifyContent: "flex-end", padding: 16 }}
        >
          <View className="gap-4 rounded-2xl border border-white/60 bg-white/80 p-5">
            <Chip label={program.category} />
            <View>
              <Typography variant="displayLg">{program.title}</Typography>
              <Typography tone="secondary" variant="bodyLg">
                {program.description}
              </Typography>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Chip label={program.duration} />
              <Chip label={program.level} />
              <Chip label={program.coach} />
            </View>
          </View>
        </ImageBackground>
      </View>

      <EditorialCard className="gap-4">
        <SectionTitle title="Protocol Architecture" />
        {["Assessment and movement calibration", "Progressive weekly loading", "Recovery and readiness checkpoints"].map((item) => (
          <View className="flex-row items-center gap-3" key={item}>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-soft">
              <Ionicons color={colors.emeraldDeep} name="checkmark" size={16} />
            </View>
            <Typography className="flex-1" variant="bodyMd">
              {item}
            </Typography>
          </View>
        ))}
      </EditorialCard>

      <PricingCard price={program.price} />

      <View className="gap-4">
        <SectionTitle title="Coach" />
        <CoachCard coach={coach} fullWidth />
      </View>

      <View className="gap-4">
        <SectionTitle title="Continue Exploring" />
        {relatedPrograms.map((item) => (
          <ProgramCard key={item.id} program={item} />
        ))}
      </View>
    </ScreenScaffold>
  );
}

export const ProgramDetailScreen = memo(ProgramDetailScreenComponent);
