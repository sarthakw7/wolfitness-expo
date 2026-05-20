import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { memo, useMemo } from "react";
import { ImageBackground, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import { CoachCard, PricingCard, ProgramCard } from "@/src/components/marketplace";
import type { CoachCardModel, ProgramCardModel } from "@/src/components/marketplace/types";
import { useEnrollProgram } from "@/src/hooks/mutations";
import { useEnrollments, usePrograms } from "@/src/hooks/queries";
import { Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

function ProgramDetailScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programsQuery = usePrograms({ publishedOnly: true });
  const enrollmentsQuery = useEnrollments();
  const enrollProgramMutation = useEnrollProgram();

  const program = useMemo(() => {
    const id = params.programId;
    if (!id) return null;
    return (programsQuery.data ?? []).find((item) => item.id === id) ?? null;
  }, [params.programId, programsQuery.data]);

  const coach = useMemo<CoachCardModel | null>(() => {
    if (!program) return null;
    return {
      discipline: program.difficulty ? program.difficulty.replace(/[_-]+/g, " ") : "Program Design",
      id: program.creator_id,
      image:
        "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
      name: `Coach ${program.creator_id.slice(0, 8)}`,
      signal: "Program author and performance systems specialist.",
    };
  }, [program]);

  const relatedPrograms = useMemo<ProgramCardModel[]>(() => {
    return (programsQuery.data ?? [])
      .filter((item) => item.id !== program?.id)
      .slice(0, 2)
      .map((item) => ({
        category: item.difficulty ? item.difficulty.replace(/[_-]+/g, " ").toUpperCase() : "PROGRAM",
        coach: `Coach ${item.creator_id.slice(0, 8)}`,
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
  }, [program?.id, programsQuery.data]);

  const alreadyEnrolled = useMemo(() => {
    if (!program) return false;
    return (enrollmentsQuery.data ?? []).some(
      (enrollment) => enrollment.program_id === program.id && enrollment.status === "active",
    );
  }, [enrollmentsQuery.data, program]);

  return (
    <ScreenScaffold bottomChrome="none" header={<AppTopBar back title="Program" />}>
      {programsQuery.isLoading ? (
        <View className="min-h-[440px] rounded-3xl bg-surface-muted" />
      ) : null}

      {programsQuery.error ? (
        <View className="rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load program</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
        </View>
      ) : null}

      {!programsQuery.isLoading && !programsQuery.error && !program ? (
        <View className="rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Program Not Found</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            This program may have been removed or is no longer published.
          </Typography>
        </View>
      ) : null}

      {program ? (
        <>
          <View className="min-h-[440px] overflow-hidden rounded-3xl bg-surface-muted shadow-luxury">
            <ImageBackground
              accessibilityLabel="Program hero image"
              source={{
                uri:
                  program.image_url ??
                  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
              }}
              style={{ flex: 1, justifyContent: "flex-end", padding: 16 }}
            >
              <View className="gap-4 rounded-2xl border border-white/60 bg-white/80 p-5">
                <Chip label={program.difficulty ? program.difficulty.replace(/[_-]+/g, " ").toUpperCase() : "PROGRAM"} />
                <View>
                  <Typography variant="displayLg">{program.title}</Typography>
                  <Typography tone="secondary" variant="bodyLg">
                    {program.description ?? "No description provided yet."}
                  </Typography>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <Chip label={program.duration_weeks ? `${program.duration_weeks} Weeks` : "Flexible"} />
                  <Chip label={program.difficulty ? program.difficulty.replace(/[_-]+/g, " ") : "All Levels"} />
                  <Chip label={`Coach ${program.creator_id.slice(0, 8)}`} />
                </View>
              </View>
            </ImageBackground>
          </View>

          <EditorialCard className="gap-4">
            <SectionTitle title="Protocol Architecture" />
            {[
              "Assessment and movement calibration",
              "Progressive weekly loading",
              "Recovery and readiness checkpoints",
            ].map((item) => (
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

          <PricingCard
            ctaDisabled={alreadyEnrolled || enrollProgramMutation.isPending}
            ctaLabel={alreadyEnrolled ? "Already Enrolled" : "Enroll Now"}
            ctaLoading={enrollProgramMutation.isPending}
            ctaOnPress={() => {
              if (alreadyEnrolled || enrollProgramMutation.isPending) return;
              enrollProgramMutation.mutate(program.id);
            }}
            price={`$${program.price}`}
          />

          <View className="gap-4">
            <SectionTitle title="Coach" />
            {coach ? <CoachCard coach={coach} fullWidth /> : null}
          </View>

          <View className="gap-4">
            <SectionTitle title="Continue Exploring" />
            {relatedPrograms.map((item) => (
              <ProgramCard key={item.id} program={item} />
            ))}
          </View>
        </>
      ) : null}
    </ScreenScaffold>
  );
}

export const ProgramDetailScreen = memo(ProgramDetailScreenComponent);

