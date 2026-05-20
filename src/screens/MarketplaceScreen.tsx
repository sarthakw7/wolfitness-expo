import { Link } from "expo-router";
import { memo, useMemo } from "react";
import { ScrollView, View } from "react-native";

import { AppTopBar, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import {
  CategoryPill,
  CoachCard,
  MarketplaceHero,
  ProgramCard,
} from "@/src/components/marketplace";
import type { CoachCardModel, ProgramCardModel } from "@/src/components/marketplace/types";
import { usePrograms } from "@/src/hooks/queries";
import { AppButton, Typography } from "@/src/components/primitives";

function MarketplaceScreenComponent() {
  const programsQuery = usePrograms({ publishedOnly: true });

  const programCards = useMemo<ProgramCardModel[]>(() => {
    return (programsQuery.data ?? []).map((program) => ({
      category: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ").toUpperCase() : "PROGRAM",
      coach: `Coach ${program.creator_id.slice(0, 8)}`,
      description: program.description ?? "No description provided yet.",
      duration: program.duration_weeks ? `${program.duration_weeks} Weeks` : "Flexible",
      id: program.id,
      image:
        program.image_url ??
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      level: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ") : "All Levels",
      price: `$${program.price}`,
      title: program.title,
    }));
  }, [programsQuery.data]);

  const featuredProgram = programCards[0] ?? null;
  const catalogPrograms = programCards.slice(1);

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add("All Programs");
    (programsQuery.data ?? []).forEach((program) => {
      if (program.difficulty) set.add(program.difficulty.replace(/[_-]+/g, " "));
    });
    return Array.from(set);
  }, [programsQuery.data]);

  const coachCards = useMemo<CoachCardModel[]>(() => {
    const map = new Map<string, CoachCardModel>();
    (programsQuery.data ?? []).forEach((program) => {
      if (!map.has(program.creator_id)) {
        map.set(program.creator_id, {
          discipline: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ") : "Program Design",
          id: program.creator_id,
          image:
            "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
          name: `Coach ${program.creator_id.slice(0, 8)}`,
          signal: "Program author and performance systems specialist.",
        });
      }
    });
    return Array.from(map.values());
  }, [programsQuery.data]);

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

      {programsQuery.isLoading ? (
        <View className="min-h-[420px] rounded-3xl bg-surface-muted" />
      ) : null}
      {programsQuery.error ? (
        <View className="rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load programs</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
        </View>
      ) : null}
      {!programsQuery.isLoading && !programsQuery.error && featuredProgram ? (
        <MarketplaceHero program={featuredProgram} />
      ) : null}
      {!programsQuery.isLoading && !programsQuery.error && !featuredProgram ? (
        <View className="rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">No Programs Published Yet</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            New training blocks will appear here once they are published.
          </Typography>
        </View>
      ) : null}

      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerClassName="gap-3 pr-container"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((category, index) => (
          <CategoryPill active={index === 0} key={category} label={category} />
        ))}
      </ScrollView>

      <View className="gap-4">
        <SectionTitle
          subtitle="Sparse, high-signal programming instead of a noisy catalog."
          title="Featured Programs"
        />
        {catalogPrograms.length === 0 && !programsQuery.isLoading && !programsQuery.error ? (
          <View className="rounded-2xl border border-border bg-surface-raised p-5">
            <Typography tone="secondary" variant="bodyMd">
              Additional programs will appear once more blocks are published.
            </Typography>
          </View>
        ) : null}
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
                params: { coachId: coachCards[0]?.id ?? "unknown-coach" },
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
          {coachCards.map((coach) => (
            <CoachCard coach={coach} key={coach.id} />
          ))}
        </ScrollView>
      </View>
    </ScreenScaffold>
  );
}

export const MarketplaceScreen = memo(MarketplaceScreenComponent);
