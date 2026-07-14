import { ScrollView, View } from "react-native";

import { EditorialCard, SectionTitle } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { ProgramCard } from "@/src/components/marketplace";
import type { ProgramCardModel } from "@/src/components/marketplace/types";

type FeaturedProgramsCarouselProps = {
  onViewAll: () => void;
  programs: ProgramCardModel[];
};

export function FeaturedProgramsCarousel({
  onViewAll,
  programs,
}: FeaturedProgramsCarouselProps) {
  return (
    <View className="mt-4 gap-3">
      <SectionTitle
        action={
          <AppButton onPress={onViewAll} size="sm" variant="ghost">View All</AppButton>
        }
        title="Active Programs"
      />
      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerClassName=""
        contentContainerStyle={{ paddingBottom: 10, paddingLeft: 2, paddingRight: 10, paddingTop: 10 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {programs.length === 0 ? (
          <EditorialCard className="w-72 items-center justify-center p-5">
            <Typography tone="secondary" variant="bodyMd">
              No published programs yet.
            </Typography>
          </EditorialCard>
        ) : null}
        {programs.map((program, index) => (
          <View key={program.id} style={{ marginRight: index === programs.length - 1 ? 0 : 18 }}>
            <ProgramCard compact program={program} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
