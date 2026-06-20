import { Ionicons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import {
  CategoryPill,
  CoachCard,
  MarketplaceHero,
  ProgramCard,
} from "@/src/components/marketplace";
import type { CoachCardModel, ProgramCardModel } from "@/src/components/marketplace/types";
import { usePrograms } from "@/src/hooks/queries";
import { usePrograms as useSignalPrograms } from "@/src/hooks/usePrograms";
import { AppButton, Typography } from "@/src/components/primitives";
import type { ProgramSummary } from "@/src/services/programs";
import { colors } from "@/src/theme";

function SignalProgramCard({ program }: { program: ProgramSummary }) {
  return (
    <Link
      asChild
      href={{
        pathname: "/(signal)/program/[programId]",
        params: { programId: program.id },
      } as Href}
    >
      <Pressable accessibilityRole="button">
        <EditorialCard className="gap-4">
          {program.coverImage ? (
            <View className="h-40 overflow-hidden rounded-3xl border border-border bg-surface-muted">
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{ uri: program.coverImage }}
                style={{ height: "100%", width: "100%" }}
              />
              <View className="absolute inset-0 bg-black/15" />
              <View className="absolute inset-x-0 bottom-0 px-4 pb-4">
                <Typography variant="labelSm" className="text-white">
                  {program.goal}
                </Typography>
              </View>
            </View>
          ) : (
            <View className="h-32 rounded-3xl border border-border bg-surface-muted px-4 py-4">
              <Typography tone="secondary" variant="labelSm">
                SIGNAL PROGRAM
              </Typography>
            </View>
          )}

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Typography variant="headlineXl">{program.title}</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {program.subtitle ?? "No subtitle provided."}
              </Typography>
            </View>
            <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={20} />
          </View>

          <View className="flex-row flex-wrap gap-2 border-t border-border pt-3">
            <Typography tone="secondary" variant="labelSm">
              {program.duration}
            </Typography>
            <Typography tone="secondary" variant="labelSm">
              {program.difficulty}
            </Typography>
            <Typography tone="secondary" variant="labelSm">
              {program.goal}
            </Typography>
          </View>
        </EditorialCard>
      </Pressable>
    </Link>
  );
}

function MarketplaceScreenComponent() {
  const programsQuery = usePrograms({ publishedOnly: true });
  const signalProgramsQuery = useSignalPrograms();
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

        <View className="gap-4">
          <SectionTitle
            subtitle="Published Signal workouts flow directly into week, day, block, and exercise detail."
            title="Signal Programs"
          />

          {signalProgramsQuery.isLoading ? (
            <View className="gap-4">
              <EditorialCard className="min-h-44 bg-surface-muted" />
              <EditorialCard className="min-h-44 bg-surface-muted" />
            </View>
          ) : null}

          {signalProgramsQuery.error ? (
            <EditorialCard className="gap-3">
              <Typography variant="headlineLg">Unable to load Signal programs</Typography>
              <Typography tone="secondary" variant="bodyMd">
                Check the Signal API connection and try again.
              </Typography>
              <View className="mt-2">
                <AppButton onPress={() => signalProgramsQuery.refetch()} variant="secondary">
                  Retry
                </AppButton>
              </View>
            </EditorialCard>
          ) : null}

          {!signalProgramsQuery.isLoading && !signalProgramsQuery.error && (signalProgramsQuery.data?.length ?? 0) === 0 ? (
            <EditorialCard className="gap-3">
              <Typography variant="headlineLg">No published Signal programs</Typography>
              <Typography tone="secondary" variant="bodyMd">
                Signal workouts will appear here after they are published.
              </Typography>
            </EditorialCard>
          ) : null}

          <View className="gap-4">
            {(signalProgramsQuery.data ?? []).map((program) => (
              <SignalProgramCard key={program.id} program={program} />
            ))}
          </View>
        </View>

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
