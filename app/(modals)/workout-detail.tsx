import { ModalSheet } from "@/src/components/layout/ModalSheet";

export default function WorkoutDetailModalRoute() {
  return (
    <ModalSheet eyebrow="Program" title="Workout Detail">
      <ModalSheet.Placeholder
        body="Exercise previews, program context, and start-workout actions will live here after the workout domain is added."
        title="Protocol detail surface"
      />
    </ModalSheet>
  );
}
