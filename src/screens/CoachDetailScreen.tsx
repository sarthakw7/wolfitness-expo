import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo } from "react";
import { Image, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold, SectionTitle, StatCard } from "@/src/components/layout";
import { ProgramCard } from "@/src/components/marketplace";
import type { ProgramCardModel } from "@/src/components/marketplace/types";
import { usePrograms } from "@/src/hooks/queries";
import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

function CoachDetailScreenComponent() {
  const params = useLocalSearchParams<{ coachId?: string }>();
  const programsQuery = usePrograms({ publishedOnly: true });

  const coachId = params.coachId ?? null;
  const programs = useMemo(() => {
    if (!coachId) return [];
    return (programsQuery.data ?? []).filter((item) => item.creator_id === coachId);
  }, [coachId, programsQuery.data]);
  const isCoachUnavailable = !coachId || (!programsQuery.isLoading && !programsQuery.error && programs.length === 0);

  useEffect(() => {
    if (!isCoachUnavailable) return;
    console.warn("[marketplace] Coach route unavailable. Showing guarded empty state.", {
      coachId,
      screen: "CoachDetail",
    });
  }, [coachId, isCoachUnavailable]);

  const displayPrograms = useMemo<ProgramCardModel[]>(() => {
    return programs.map((item) => ({
      category: item.difficulty ? item.difficulty.replace(/[_-]+/g, " ").toUpperCase() : "PROGRAM",
      coach: item.coach_name ?? "Wolfitness Coach",
      description: item.description ?? "No description provided yet.",
      duration: item.duration_weeks ? `${item.duration_weeks} Weeks` : "Flexible",
      id: item.id,
      image:
        item.image_url ??
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      level: item.difficulty ? item.difficulty.replace(/[_-]+/g, " ") : "All Levels",
      price: `$${item.price}`,
      title: item.title,
    }));
  }, [programs]);

  const coachName = programs[0]?.coach_name ?? "Coach";
  const coachImage =
    programs[0]?.coach_avatar_url ??
    "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop";

  return (
    <ScreenScaffold bottomChrome="none" contentClassName="gap-6" header={<AppTopBar back title="Coach" />}>
      <View className="gap-6 px-2">
        {programsQuery.isLoading ? (
          <View className="min-h-[260px] rounded-3xl bg-surface-muted" />
        ) : null}

        {programsQuery.error ? (
          <View className="rounded-2xl border border-border bg-surface-raised p-5">
            <Typography variant="headlineLg">Unable to load coach</Typography>
            <Typography className="mt-1" tone="secondary" variant="bodyMd">
              Please try again in a moment.
            </Typography>
          </View>
        ) : null}

        {isCoachUnavailable ? (
          <View className="rounded-2xl border border-border bg-surface-raised p-5">
            <Typography variant="headlineLg">Coach Unavailable</Typography>
            <Typography className="mt-1" tone="secondary" variant="bodyMd">
              This coach is not currently available in the marketplace.
            </Typography>
          </View>
        ) : null}

        {!programsQuery.isLoading && !programsQuery.error && !isCoachUnavailable ? (
          <View className="gap-gutter">
          <View className="items-center gap-5 rounded-3xl border border-border bg-surface-raised p-6">
            <View className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-surface-muted">
              <Image
                source={{
                  uri: coachImage,
                }}
                style={{ height: "100%", width: "100%" }}
              />
            </View>
            <View className="items-center gap-2">
              <Typography align="center" variant="displayLg">
                {coachName}
              </Typography>
              <Typography align="center" tone="accent" variant="labelMd">
                Program Design
              </Typography>
              <Typography align="center" tone="secondary" variant="bodyLg">
                Coach profile derived from live marketplace program ownership.
              </Typography>
            </View>
          </View>

          <View className="flex-row gap-gutter">
            <StatCard className="flex-1" label="Programs" value={String(displayPrograms.length)} />
            <StatCard className="flex-1" label="Focus" value="Performance" />
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
          </View>
        ) : null}
      </View>
    </ScreenScaffold>
  );
}

export const CoachDetailScreen = memo(CoachDetailScreenComponent);
