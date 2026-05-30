import { ModalSheet } from "@/src/components/layout/ModalSheet";
import { AppButton } from "@/src/components/primitives";
import { router } from "expo-router";

export default function WorkoutDetailModalRoute() {
  return (
    <ModalSheet eyebrow="Program" title="Workout Detail">
      <ModalSheet.Placeholder
        body="Exercise previews, program context, and start-workout actions will live here after the workout domain is added."
        title="Coming Soon"
      />
      <AppButton onPress={() => router.back()} variant="secondary">
        Back
      </AppButton>
    </ModalSheet>
  );
}
