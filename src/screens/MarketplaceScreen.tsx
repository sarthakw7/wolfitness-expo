import { Link } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
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
  const [selectedCategory, setSelectedCategory] = useState("All Programs");

  useEffect(() => {
    if (!programsQuery.error) return;
    console.warn("[athlete-flow]", {
      error: programsQuery.error instanceof Error ? programsQuery.error.message : String(programsQuery.error),
      screen: "Marketplace",
      type: "programs",
    });
  }, [programsQuery.error]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add("All Programs");
    (programsQuery.data ?? []).forEach((program) => {
      if (program.difficulty) set.add(program.difficulty.replace(/[_-]+/g, " "));
    });
    return Array.from(set);
  }, [programsQuery.data]);

  const filteredPrograms = useMemo(() => {
    const all = programsQuery.data ?? [];
    if (selectedCategory === "All Programs") return all;
    const key = selectedCategory.toLowerCase().trim();
    return all.filter((program) => {
      const diff = (program.difficulty ?? "").replace(/[_-]+/g, " ").toLowerCase().trim();
      return diff === key;
    });
  }, [programsQuery.data, selectedCategory]);

  const programCards = useMemo<ProgramCardModel[]>(() => {
    return filteredPrograms.map((program) => ({
      category: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ").toUpperCase() : "PROGRAM",
      coach: program.coach_name ?? "Wolfitness Coach",
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
  }, [filteredPrograms]);

  const featuredProgram = programCards[0] ?? null;
  const catalogPrograms = programCards.slice(1);

  const coachCards = useMemo<CoachCardModel[]>(() => {
    const map = new Map<string, CoachCardModel>();
    filteredPrograms.forEach((program) => {
      if (!map.has(program.creator_id)) {
        map.set(program.creator_id, {
          discipline: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ") : "Program Design",
          id: program.creator_id,
          image:
            program.coach_avatar_url ??
            "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
          name: program.coach_name ?? "Wolfitness Coach",
          signal: "Program author and performance systems specialist.",
        });
      }
    });
    return Array.from(map.values());
  }, [filteredPrograms]);
  const hasCoachCatalog = coachCards.length > 0;

  return (
    <ScreenScaffold bottomChrome="none" contentClassName="gap-6" header={<AppTopBar back title="Marketplace" />}>
      <View className="gap-6 px-2">
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
            <View className="mt-4">
              <AppButton onPress={() => programsQuery.refetch()} variant="secondary">
                Retry
              </AppButton>
            </View>
          </View>
        ) : null}
        {!programsQuery.isLoading && !programsQuery.error && featuredProgram ? (
          <MarketplaceHero program={featuredProgram} />
        ) : null}
        {!programsQuery.isLoading && !programsQuery.error && !featuredProgram ? (
          <View className="rounded-2xl border border-border bg-surface-raised p-5">
            <Typography variant="headlineLg">No Programs Found</Typography>
            <Typography className="mt-1" tone="secondary" variant="bodyMd">
              Try a different category filter.
            </Typography>
          </View>
        ) : null}

        <ScrollView
          alwaysBounceHorizontal={false}
          contentContainerClassName="gap-3"
          contentContainerStyle={{ paddingBottom: 2, paddingLeft: 4, paddingRight: 10, paddingTop: 2 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => (
            <CategoryPill
              active={selectedCategory === category}
              key={category}
              label={category}
              onPress={() => setSelectedCategory(category)}
            />
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
              hasCoachCatalog ? (
                <Link
                  asChild
                  href={{
                    pathname: "/(marketplace)/coach/[coachId]",
                    params: { coachId: coachCards[0].id },
                  }}
                >
                  <AppButton size="sm" variant="ghost">
                    Explore
                  </AppButton>
                </Link>
              ) : (
                <AppButton
                  onPress={() => {
                    console.warn("[marketplace] Coach catalog unavailable. Prevented coach route navigation.", {
                      screen: "Marketplace",
                    });
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Explore
                </AppButton>
              )
            }
            subtitle="Specialists behind the training systems."
            title="Elite Coaches"
          />
          <ScrollView
            alwaysBounceHorizontal={false}
            contentContainerClassName=""
            contentContainerStyle={{ paddingBottom: 4, paddingLeft: 2, paddingRight: 10, paddingTop: 4 }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {coachCards.map((coach, index) => (
              <View key={coach.id} style={{ marginRight: index === coachCards.length - 1 ? 0 : 16 }}>
                <CoachCard coach={coach} />
              </View>
            ))}
          </ScrollView>
          {!hasCoachCatalog && !programsQuery.isLoading && !programsQuery.error ? (
            <View className="rounded-2xl border border-border bg-surface-raised p-5">
              <Typography tone="secondary" variant="bodyMd">
                Coaches will appear when published programs are available.
              </Typography>
            </View>
          ) : null}
        </View>
      </View>
    </ScreenScaffold>
  );
}

export const MarketplaceScreen = memo(MarketplaceScreenComponent);
