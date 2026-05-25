import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { ImageBackground, View } from "react-native";

import { AppTopBar, Chip, EditorialCard, ScreenScaffold, SectionTitle } from "@/src/components/layout";
import { CoachCard, PricingCard, ProgramCard } from "@/src/components/marketplace";
import type { CoachCardModel, ProgramCardModel } from "@/src/components/marketplace/types";
import { AppButton, Typography } from "@/src/components/primitives";
import { useEnrollProgram } from "@/src/hooks/mutations";
import { useEnrollments, useProgramStructure, usePrograms, useWorkout, useWorkoutSessionStatus } from "@/src/hooks/queries";
import { colors } from "@/src/theme";

function ProgramDetailScreenComponent() {
  const params = useLocalSearchParams<{ programId?: string }>();
  const programsQuery = usePrograms({ publishedOnly: true });
  const enrollmentsQuery = useEnrollments();
  const workoutQuery = useWorkout();
  const workoutSessionStatusQuery = useWorkoutSessionStatus(workoutQuery.data ?? null);
  const enrollProgramMutation = useEnrollProgram();
  const programStructureQuery = useProgramStructure(params.programId ?? null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    setEnrollError(null);
  }, [params.programId]);

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
        program.coach_avatar_url ??
        "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop",
      name: program.coach_name ?? "Wolfitness Coach",
      signal: "Program author and performance systems specialist.",
    };
  }, [program]);

  const relatedPrograms = useMemo<ProgramCardModel[]>(() => {
    return (programsQuery.data ?? [])
      .filter((item) => item.id !== program?.id)
      .slice(0, 2)
      .map((item) => ({
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
  }, [program?.id, programsQuery.data]);

  const alreadyEnrolled = useMemo(() => {
    if (!program) return false;
    return (enrollmentsQuery.data ?? []).some(
      (enrollment) => enrollment.program_id === program.id && enrollment.status === "active",
    );
  }, [enrollmentsQuery.data, program]);

  const isTodayProgram = useMemo(() => {
    if (!program || !workoutQuery.data?.program.id) return false;
    return workoutQuery.data.program.id === program.id;
  }, [program, workoutQuery.data?.program.id]);

  const workoutCta = useMemo(() => {
    if (!alreadyEnrolled) {
      return {
        action: "enroll" as const,
        disabled: enrollProgramMutation.isPending,
        label: "Start Program",
        loading: enrollProgramMutation.isPending,
      };
    }

    if (!isTodayProgram) {
      return {
        action: "workout-link" as const,
        disabled: false,
        label: "Continue Workout",
        loading: false,
      };
    }

    if (workoutSessionStatusQuery.data) {
      return {
        action: "workout-link" as const,
        disabled: false,
        label: "Resume Workout",
        loading: false,
      };
    }

    return {
      action: "workout-link" as const,
      disabled: false,
      label: "Start Today's Workout",
      loading: false,
    };
  }, [
    alreadyEnrolled,
    enrollProgramMutation.isPending,
    isTodayProgram,
    workoutSessionStatusQuery.data,
  ]);

  const handleEnroll = async () => {
    if (!program || enrollProgramMutation.isPending) return;
    setEnrollError(null);

    try {
      await enrollProgramMutation.mutateAsync(program.id);
      router.push("/(tabs)/workouts");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start this program.";
      console.warn("[athlete-flow]", {
        error: message,
        programId: program.id,
        screen: "ProgramDetail",
        type: "enroll",
      });
      setEnrollError(message);
    }
  };

  return (
    <ScreenScaffold bottomChrome="none" header={<AppTopBar back title="Program" />}>
      {programsQuery.isLoading ? (
        <View className="mx-1 min-h-[440px] rounded-3xl bg-surface-muted" />
      ) : null}

      {programsQuery.error ? (
        <View className="mx-1 rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Unable to load program</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            Please try again in a moment.
          </Typography>
        </View>
      ) : null}

      {!programsQuery.isLoading && !programsQuery.error && !program ? (
        <View className="mx-1 rounded-2xl border border-border bg-surface-raised p-5">
          <Typography variant="headlineLg">Program Not Found</Typography>
          <Typography className="mt-1" tone="secondary" variant="bodyMd">
            This program may have been removed or is no longer published.
          </Typography>
        </View>
      ) : null}

      {program ? (
        <View className="mx-1 gap-gutter">
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
                  <Chip label={program.coach_name ?? "Wolfitness Coach"} />
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
            ctaDisabled={workoutCta.disabled}
            ctaLabel={workoutCta.label}
            ctaLoading={workoutCta.loading}
            ctaOnPress={async () => {
              if (workoutCta.action === "enroll") {
                await handleEnroll();
                return;
              }
              router.push("/(tabs)/workouts");
            }}
            price={`$${program.price}`}
          />

          {enrollError ? (
            <EditorialCard className="gap-3">
              <Typography variant="headlineLg">Unable to start program</Typography>
              <Typography tone="secondary" variant="bodyMd">
                {enrollError}
              </Typography>
              <AppButton
                isLoading={enrollProgramMutation.isPending}
                onPress={handleEnroll}
                variant="secondary"
              >
                Retry
              </AppButton>
            </EditorialCard>
          ) : null}

          <View className="gap-4">
            <SectionTitle title="Inside This Program" />
            {programStructureQuery.isLoading ? (
              <EditorialCard className="gap-3">
                <Typography tone="secondary" variant="bodyMd">
                  Loading program structure...
                </Typography>
              </EditorialCard>
            ) : null}
            {programStructureQuery.error ? (
              <EditorialCard className="gap-3">
                <Typography variant="headlineLg">Unable to load structure</Typography>
                <Typography tone="secondary" variant="bodyMd">
                  Please try again in a moment.
                </Typography>
              </EditorialCard>
            ) : null}
            {!programStructureQuery.isLoading &&
            !programStructureQuery.error &&
            (programStructureQuery.data ?? []).length === 0 ? (
              <EditorialCard className="gap-3">
                <Typography tone="secondary" variant="bodyMd">
                  Program weeks and days are not published yet.
                </Typography>
              </EditorialCard>
            ) : null}
            {(programStructureQuery.data ?? []).map((week) => (
              <EditorialCard className="gap-4" key={week.id}>
                <Typography variant="headlineLg">
                  {week.title ?? `Week ${week.week_number}`}
                </Typography>
                {week.days.map((day) => (
                  <View className="gap-2 border-t border-border pt-3" key={day.id}>
                    <Typography variant="labelMd">
                      {day.title ?? `Day ${day.day_number}`}
                    </Typography>
                    {day.exercises.length === 0 ? (
                      <Typography tone="secondary" variant="bodyMd">
                        No exercises added yet.
                      </Typography>
                    ) : (
                      day.exercises.slice(0, 4).map((exercise, idx) => (
                        <Typography key={`${day.id}-${idx}`} tone="secondary" variant="bodyMd">
                          • {exercise.name}
                          {exercise.target_sets ? ` · ${exercise.target_sets} sets` : ""}
                          {exercise.target_reps ? ` · ${exercise.target_reps} reps` : ""}
                        </Typography>
                      ))
                    )}
                    {day.exercises.length > 4 ? (
                      <Typography tone="secondary" variant="labelSm">
                        +{day.exercises.length - 4} more exercises
                      </Typography>
                    ) : null}
                  </View>
                ))}
              </EditorialCard>
            ))}
          </View>

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
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

export const ProgramDetailScreen = memo(ProgramDetailScreenComponent);
