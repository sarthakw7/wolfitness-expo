import { ModalSheet } from "@/src/components/layout/ModalSheet";
import { AppButton } from "@/src/components/primitives";
import { router } from "expo-router";

export default function QuickLogModalRoute() {
  return (
    <ModalSheet eyebrow="Athlete OS" title="Quick Log">
      <ModalSheet.Placeholder
        body="Fast capture for training notes, body metrics, and recovery markers will compose inside this sheet."
        title="Coming Soon"
      />
      <AppButton onPress={() => router.back()} variant="secondary">
        Back
      </AppButton>
    </ModalSheet>
  );
}
