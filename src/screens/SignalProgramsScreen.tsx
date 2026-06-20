import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo } from "react";
import { Image, Pressable, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { Typography } from "@/src/components/primitives";
import { usePrograms } from "@/src/hooks/usePrograms";
import { colors } from "@/src/theme";

function ProgramCardSkeleton() {
  return <EditorialCard className="min-h-44 bg-surface-muted" />;
}

function ProgramCover({ uri, title }: { title: string; uri: string | null }) {
  if (!uri) {
    return (
      <View className="h-40 overflow-hidden rounded-3xl border border-border bg-surface-muted" />
    );
  }

  return (
    <View className="h-40 overflow-hidden rounded-3xl border border-border bg-surface-muted">
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri }}
        style={{ height: "100%", width: "100%" }}
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-black/20" />
      <View className="absolute inset-x-0 bottom-0 px-4 pb-4">
        <Typography variant="labelSm" className="text-white">
          {title}
        </Typography>
      </View>
    </View>
  );
}

function SignalProgramsScreenComponent() {
  const programsQuery = usePrograms();

  return (
    <ScreenScaffold bottomChrome="none" contentClassName="gap-6" header={<AppTopBar back={false} title="Signal Programs" />}>
      <View className="gap-4 px-2">
        <View className="gap-2">
          <Typography tone="secondary" variant="labelSm">
            READ-ONLY BROWSE
          </Typography>
          <Typography variant="displayLg">Published workout programs</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Browse the published Signal workout catalog and open any program to inspect its weeks, days, blocks, and exercises.
          </Typography>
        </View>

        {programsQuery.isLoading ? (
          <View className="gap-4">
            <ProgramCardSkeleton />
            <ProgramCardSkeleton />
            <ProgramCardSkeleton />
          </View>
        ) : null}

        {programsQuery.error ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">Unable to load programs</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Check the API configuration and try again.
            </Typography>
          </EditorialCard>
        ) : null}

        {!programsQuery.isLoading && !programsQuery.error && (programsQuery.data?.length ?? 0) === 0 ? (
          <EditorialCard className="gap-3">
            <Typography variant="headlineLg">No published programs</Typography>
            <Typography tone="secondary" variant="bodyMd">
              Nothing has been published yet.
            </Typography>
          </EditorialCard>
        ) : null}

        <View className="gap-4">
          {(programsQuery.data ?? []).map((program) => (
            <Link
              asChild
              href={{
                pathname: "/program/[programId]",
                params: { programId: program.id },
              }}
              key={program.id}
            >
              <Pressable accessibilityRole="button">
                <EditorialCard className="gap-4">
                  <ProgramCover title={program.title} uri={program.coverImage} />
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 gap-2">
                      <Typography variant="headlineXl">{program.title}</Typography>
                      <Typography tone="secondary" variant="bodyMd">
                        {program.subtitle ?? "No subtitle provided."}
                      </Typography>
                    </View>
                    <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={20} />
                  </View>

                  <View className="flex-row flex-wrap gap-2">
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
          ))}
        </View>
      </View>
    </ScreenScaffold>
  );
}

export const SignalProgramsScreen = memo(SignalProgramsScreenComponent);
