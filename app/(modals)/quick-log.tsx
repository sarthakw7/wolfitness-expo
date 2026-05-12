import { ModalSheet } from "@/src/components/layout/ModalSheet";

export default function QuickLogModalRoute() {
  return (
    <ModalSheet eyebrow="Athlete OS" title="Quick Log">
      <ModalSheet.Placeholder
        body="Fast capture for training notes, body metrics, and recovery markers will compose inside this sheet."
        title="Quick entry surface"
      />
    </ModalSheet>
  );
}
