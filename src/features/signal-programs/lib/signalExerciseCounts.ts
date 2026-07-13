import type {
  WorkoutProgramPayload,
  WorkoutProgramPayloadBlock,
  WorkoutProgramPayloadDay,
  WorkoutProgramPayloadWeek,
} from "@/src/services/programs";
import { isSignalPlayableDay } from "./signalSelection";

export function countExercisesInBlock(block: WorkoutProgramPayloadBlock) {
  return block.exercises.length;
}

export function countExercisesInDay(day: WorkoutProgramPayloadDay | WorkoutProgramPayloadBlock[] | null | undefined) {
  if (!day) return 0;
  const blocks = Array.isArray(day) ? day : day.blocks;
  return blocks.reduce((sum, block) => sum + countExercisesInBlock(block), 0);
}

export function countExercisesInWeek(week: WorkoutProgramPayloadWeek) {
  return week.days.reduce((dayTotal, day) => dayTotal + countExercisesInDay(day), 0);
}

export function countPlayableWorkouts(payload: WorkoutProgramPayload) {
  return payload.weeks.reduce((weekTotal, week) => {
    return weekTotal + week.days.filter((day) => isSignalPlayableDay(day)).length;
  }, 0);
}
