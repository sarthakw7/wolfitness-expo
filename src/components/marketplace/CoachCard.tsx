import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo } from "react";
import { Image, Pressable, View } from "react-native";

import { GlassCard, Typography } from "@/src/components/primitives";
import type { MarketplaceCoach } from "@/src/constants/marketplace";
import { colors } from "@/src/theme";

type CoachCardProps = {
  coach: MarketplaceCoach;
  fullWidth?: boolean;
};

function CoachCardComponent({ coach, fullWidth }: CoachCardProps) {
  return (
    <Link
      asChild
      href={{
        pathname: "/(marketplace)/coach/[coachId]",
        params: { coachId: coach.id },
      }}
    >
      <Pressable accessibilityRole="button" className={fullWidth ? "w-full" : "w-72"}>
        <GlassCard className="gap-4">
          <View className="flex-row items-center gap-4">
            <View className="h-20 w-20 overflow-hidden rounded-full bg-surface-muted">
              <Image source={{ uri: coach.image }} style={{ height: "100%", width: "100%" }} />
            </View>
            <View className="flex-1">
              <Typography variant="headlineLg">{coach.name}</Typography>
              <Typography tone="accent" variant="labelSm">
                {coach.discipline}
              </Typography>
            </View>
          </View>
          <Typography tone="secondary" variant="bodyMd">
            {coach.signal}
          </Typography>
          <View className="flex-row items-center justify-between border-t border-border pt-4">
            <Typography variant="labelSm">View Coach</Typography>
            <Ionicons color={colors.graphite} name="arrow-forward" size={18} />
          </View>
        </GlassCard>
      </Pressable>
    </Link>
  );
}

export const CoachCard = memo(CoachCardComponent);
