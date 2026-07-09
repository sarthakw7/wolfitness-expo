import type { ActiveProgramRow } from "@/src/services/active-program.service";

export type SignalProgramLifecycleRow = ActiveProgramRow;

export type SignalProgramLifecycleState = "active" | "completed" | "replaced" | "not_joined";

export type SignalProgramStartPoint = {
  dayKey: string;
  weekKey: string;
};

export type SignalProgramLifecycleProgram = {
  id: string;
  title: string;
  versionId: string | null;
};
