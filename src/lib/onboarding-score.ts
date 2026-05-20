import type { OnboardingDraft } from "@/src/lib/onboarding-draft";

export type VibeType = "balanced" | "power" | "endurance" | "mobility";

export type VibeMetrics = {
  power: number;
  endurance: number;
  mobility: number;
};

function clamp0_100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function ageFromDob(dobIso?: string): number | null {
  if (!dobIso) return null;
  const [y, m, d] = dobIso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dob = new Date(y, m - 1, d);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hadBirthday =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

// Deterministic, explainable scoring model.
// This is not "science"; it's a product heuristic we can tune over time.
export function computeVibeFromDraft(draft: OnboardingDraft): {
  vibeType: VibeType;
  metrics: VibeMetrics;
  age: number | null;
} {
  let power = 50;
  let endurance = 50;
  let mobility = 50;

  // Primary goal = dominant bias.
  switch (draft.primaryGoal) {
    case "build_muscle":
      power += 18;
      endurance += 4;
      break;
    case "lose_fat":
      endurance += 12;
      mobility += 4;
      break;
    case "increase_endurance":
      endurance += 18;
      mobility += 4;
      break;
    case "improve_mobility":
      mobility += 18;
      endurance += 4;
      break;
  }

  // Experience: higher experience tends to correlate with strength/power competence.
  switch (draft.experienceLevel) {
    case "beginner":
      mobility += 4;
      break;
    case "intermediate":
      power += 4;
      endurance += 2;
      break;
    case "advanced":
      power += 6;
      endurance += 3;
      break;
    case "elite":
      power += 8;
      endurance += 4;
      break;
  }

  // Equipment access: more equipment tends to increase power development options.
  switch (draft.equipmentAccess) {
    case "full_gym":
      power += 8;
      break;
    case "home_gym":
      power += 6;
      break;
    case "dumbbells":
      endurance += 4;
      mobility += 2;
      break;
    case "bodyweight":
      mobility += 6;
      endurance += 4;
      break;
  }

  // Injuries: reduce certain dimensions slightly and shift toward mobility.
  const injuries = Array.isArray(draft.injuries) ? draft.injuries : [];
  for (const i of injuries) {
    switch (i) {
      case "knees":
        power -= 4;
        endurance -= 4;
        mobility += 2;
        break;
      case "lower_back":
        power -= 5;
        mobility += 2;
        break;
      case "wrists":
        power -= 3;
        mobility += 1;
        break;
      case "shoulders":
        power -= 4;
        mobility += 2;
        break;
      case "hips":
        power -= 3;
        endurance -= 2;
        mobility += 3;
        break;
      case "other":
        mobility += 2;
        break;
    }
  }

  // Age: older athletes typically benefit from mobility emphasis and slightly less power bias.
  const age = ageFromDob(draft.dateOfBirth);
  if (age != null) {
    if (age >= 35) mobility += 6;
    if (age >= 45) power -= 2;
    if (age >= 55) endurance -= 2;
  }

  const metrics: VibeMetrics = {
    power: clamp0_100(power),
    endurance: clamp0_100(endurance),
    mobility: clamp0_100(mobility),
  };

  const entries = Object.entries(metrics) as Array<[keyof VibeMetrics, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = entries[0];
  const bottomVal = entries[entries.length - 1][1];

  // Balanced if the spread is small.
  const vibeType: VibeType = topVal - bottomVal <= 8 ? "balanced" : (topKey as VibeType);

  return { vibeType, metrics, age };
}

