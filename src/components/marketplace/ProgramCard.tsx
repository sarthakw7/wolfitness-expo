import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo } from "react";
import { ImageBackground, Pressable, View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import type { MarketplaceProgram } from "@/src/constants/marketplace";
import { colors } from "@/src/theme";

type ProgramCardProps = {
  compact?: boolean;
  program: MarketplaceProgram;
};

function ProgramCardComponent({ compact, program }: ProgramCardProps) {
  return (
    <Link
      asChild
      href={{
        pathname: "/(marketplace)/program/[programId]",
        params: { programId: program.id },
      }}
    >
      <Pressable accessibilityRole="button" className={compact ? "w-72" : "w-full"}>
        <EditorialCard className="overflow-hidden p-0">
          <View className={compact ? "h-44 bg-surface-muted" : "h-64 bg-surface-muted"}>
            <ImageBackground
              source={{ uri: program.image }}
              style={{ flex: 1, justifyContent: "flex-start", padding: 16 }}
            >
              <View className="self-end rounded-full border border-white/60 bg-white/80 px-3 py-1">
                <Typography variant="labelSm">{program.category}</Typography>
              </View>
            </ImageBackground>
          </View>
          <View className="gap-4 p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Typography variant={compact ? "headlineLg" : "headlineXl"}>
                  {program.title}
                </Typography>
                <Typography tone="secondary" variant="labelSm">
                  {program.coach}
                </Typography>
              </View>
              <Typography tone="accent" variant="headlineLg">
                {program.price}
              </Typography>
            </View>
            <Typography tone="secondary" variant="bodyMd">
              {program.description}
            </Typography>
            <View className="flex-row items-center justify-between border-t border-border pt-4">
              <View className="flex-1 flex-row flex-wrap gap-x-4 gap-y-2">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons color={colors.graphiteMuted} name="calendar-outline" size={16} />
                  <Typography tone="secondary" variant="labelSm">
                    {program.duration}
                  </Typography>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons color={colors.graphiteMuted} name="barbell-outline" size={16} />
                  <Typography tone="secondary" variant="labelSm">
                    {program.level}
                  </Typography>
                </View>
              </View>
              <Ionicons color={colors.graphite} name="arrow-forward" size={22} />
            </View>
          </View>
        </EditorialCard>
      </Pressable>
    </Link>
  );
}

export const ProgramCard = memo(ProgramCardComponent);
