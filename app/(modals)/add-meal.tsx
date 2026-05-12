import { ModalSheet } from "@/src/components/layout/ModalSheet";

export default function AddMealModalRoute() {
  return (
    <ModalSheet eyebrow="Nutrition" title="Add Meal">
      <ModalSheet.Placeholder
        body="Meal capture, barcode scanning, and macro editing will attach here without changing the modal contract."
        title="Meal logging surface"
      />
    </ModalSheet>
  );
}
