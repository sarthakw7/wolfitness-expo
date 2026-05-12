import { Link } from "expo-router";
import { memo } from "react";
import { ScrollView, View } from "react-native";

import { AppTopBar, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import {
  CategoryPill,
  CoachCard,
  MarketplaceHero,
  ProgramCard,
} from "@/src/components/marketplace";
import { AppButton, Typography } from "@/src/components/primitives";
import {
  marketplaceCategories,
  marketplaceCoaches,
  marketplacePrograms,
} from "@/src/constants/marketplace";

function MarketplaceScreenComponent() {
  const featuredProgram = marketplacePrograms[0];
  const catalogPrograms = marketplacePrograms.slice(1);

  return (
    <ScreenScaffold bottomChrome="none" header={<AppTopBar back title="Marketplace" />}>
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          Curated Protocols
        </Typography>
        <Typography variant="displayLg">Program Marketplace</Typography>
        <Typography tone="secondary" variant="bodyLg">
          Coach-led training blocks selected for strength, movement quality, and long-range athletic durability.
        </Typography>
      </View>

      <MarketplaceHero program={featuredProgram} />

      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerClassName="gap-3 pr-container"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {marketplaceCategories.map((category, index) => (
          <CategoryPill active={index === 0} key={category} label={category} />
        ))}
      </ScrollView>

      <View className="gap-4">
        <SectionTitle
          subtitle="Sparse, high-signal programming instead of a noisy catalog."
          title="Featured Programs"
        />
        {catalogPrograms.map((program) => (
          <ProgramCard key={program.id} program={program} />
        ))}
      </View>

      <View className="gap-4">
        <SectionTitle
          action={
            <Link
              asChild
              href={{
                pathname: "/(marketplace)/coach/[coachId]",
                params: { coachId: marketplaceCoaches[0].id },
              }}
            >
              <AppButton size="sm" variant="ghost">Explore</AppButton>
            </Link>
          }
          subtitle="Specialists behind the training systems."
          title="Elite Coaches"
        />
        <ScrollView
          alwaysBounceHorizontal={false}
          contentContainerClassName="gap-gutter pr-container"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {marketplaceCoaches.map((coach) => (
            <CoachCard coach={coach} key={coach.id} />
          ))}
        </ScrollView>
      </View>
    </ScreenScaffold>
  );
}

export const MarketplaceScreen = memo(MarketplaceScreenComponent);
