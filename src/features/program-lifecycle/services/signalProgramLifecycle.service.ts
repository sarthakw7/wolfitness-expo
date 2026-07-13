import { activeProgramService, workoutService } from "@/src/services";
import { findFirstPlayableSignalSelection } from "@/src/features/signal-programs/lib/signalSelection";
import type { WorkoutProgramPayloadWeek } from "@/src/services/programs";
import type { ActiveProgramRow } from "@/src/services/active-program.service";

import type { SignalProgramStartPoint } from "../types";

export async function fetchLatestSignalProgramLifecycle(userId: string): Promise<ActiveProgramRow | null> {
  return activeProgramService.getLatestSignalProgramLifecycle(userId);
}

export async function resetActiveSignalProgram(input: {
  activeProgramId: string;
  firstPlayableStart: SignalProgramStartPoint;
  signalProgramId: string;
  signalProgramVersion: string | null;
  userId: string;
}): Promise<ActiveProgramRow> {
  await workoutService.clearUnfinishedSignalWorkoutSessionsForActiveProgram({
    activeProgramId: input.activeProgramId,
    userId: input.userId,
  });

  const startedProgram = await activeProgramService.startSignalProgram({
    firstDayKey: input.firstPlayableStart.dayKey,
    firstWeekKey: input.firstPlayableStart.weekKey,
    signalProgramId: input.signalProgramId,
    signalProgramVersion: input.signalProgramVersion,
    userId: input.userId,
  });

  const activeProgram = await activeProgramService.getActiveProgram(input.userId);
  return activeProgram ?? startedProgram;
}

export async function unjoinActiveSignalProgram(input: {
  activeProgramId: string;
  signalProgramId: string;
  userId: string;
}): Promise<ActiveProgramRow> {
  await workoutService.clearUnfinishedSignalWorkoutSessionsForActiveProgram({
    activeProgramId: input.activeProgramId,
    userId: input.userId,
  });

  return activeProgramService.leaveSignalProgram({
    activeProgramId: input.activeProgramId,
    signalProgramId: input.signalProgramId,
    userId: input.userId,
  });
}

export async function restartCompletedSignalProgram(input: {
  completedLifecycleId: string;
  firstPlayableStart: SignalProgramStartPoint;
  signalProgramId: string;
  signalProgramVersion: string | null;
  userId: string;
}): Promise<ActiveProgramRow> {
  await workoutService.clearUnfinishedSignalWorkoutSessionsForActiveProgram({
    activeProgramId: input.completedLifecycleId,
    userId: input.userId,
  });

  const startedProgram = await activeProgramService.startSignalProgram({
    firstDayKey: input.firstPlayableStart.dayKey,
    firstWeekKey: input.firstPlayableStart.weekKey,
    signalProgramId: input.signalProgramId,
    signalProgramVersion: input.signalProgramVersion,
    userId: input.userId,
  });

  const activeProgram = await activeProgramService.getActiveProgram(input.userId);
  return activeProgram ?? startedProgram;
}

export function findFirstPlayableSignalStartPoint(
  weeks: WorkoutProgramPayloadWeek[],
): SignalProgramStartPoint | null {
  return findFirstPlayableSignalSelection(weeks);
}
