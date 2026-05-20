import { Link } from "expo-router";
import { memo } from "react";
import { ImageBackground, View } from "react-native";

import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import type { ProgramCardModel } from "@/src/components/marketplace/types";

type MarketplaceHeroProps = {
  program: ProgramCardModel;
};

function MarketplaceHeroComponent({ program }: MarketplaceHeroProps) {
  return (
    <View className="min-h-[460px] overflow-hidden rounded-3xl bg-surface-muted shadow-luxury">
      <ImageBackground
        accessibilityLabel="Marketplace highlight"
        source={{ uri: program.image }}
        style={{ flex: 1, justifyContent: "flex-end", padding: 16 }}
      >
        <GlassCard className="gap-5" tier="floating">
          <View className="self-start rounded-full border border-border bg-surface-raised px-4 py-1.5">
            <Typography variant="labelSm">{program.category}</Typography>
          </View>
          <View className="gap-2">
            <Typography variant="displayLg">{program.title}</Typography>
            <Typography tone="secondary" variant="bodyLg">
              {program.description}
            </Typography>
          </View>
          <View className="flex-row items-center justify-between gap-4">
            <Link
              asChild
              href={{
                pathname: "/(marketplace)/program/[programId]",
                params: { programId: program.id },
              }}
            >
              <AppButton className="flex-1">View Program</AppButton>
            </Link>
            <Typography tone="secondary" variant="labelMd">
              {program.price} USD
            </Typography>
          </View>
        </GlassCard>
      </ImageBackground>
    </View>
  );
}

export const MarketplaceHero = memo(MarketplaceHeroComponent);
