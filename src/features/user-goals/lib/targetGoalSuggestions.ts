import type { GoalTypeValue } from "../types";

const TARGET_GOAL_SUGGESTIONS: Record<GoalTypeValue, string[]> = {
  fat_loss: ["Lose 5 kg", "Reach 15% body fat", "Reduce waist size", "Feel leaner by summer"],
  muscle_gain: ["Gain 3 kg lean mass", "Build lean muscle", "Improve physique", "Add size without excess fat"],
  strength: ["Increase squat", "Increase bench press", "Deadlift more weight", "Get stronger overall"],
  endurance: ["Run 5K comfortably", "Improve stamina", "Increase cardio capacity", "Train without getting tired quickly"],
  hybrid_athlete: [
    "Improve strength and conditioning",
    "Build athletic performance",
    "Balance lifting and cardio",
    "Move better and feel stronger",
  ],
  general_health: ["Stay active weekly", "Improve energy", "Build healthy habits", "Feel better day to day"],
};

export function getTargetGoalSuggestions(goalType: GoalTypeValue | null | undefined) {
  if (!goalType) return [];
  return TARGET_GOAL_SUGGESTIONS[goalType] ?? [];
}
