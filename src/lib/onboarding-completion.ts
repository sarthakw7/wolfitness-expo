type FitnessProfileForOnboarding = {
  date_of_birth?: string | null;
  equipment_access?: string[] | null;
  experience_level?: string | null;
  gender?: string | null;
  height_cm?: number | null;
  primary_goal?: string | null;
  training_availability?: string[] | null;
  weight_kg?: number | null;
} | null | undefined;

type OnboardingAssessmentForCompletion = {
  id?: string | null;
  raw_answers?: Record<string, unknown> | null;
} | null | undefined;

function hasNonEmptyString(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function hasNonEmptyStringArray(value: string[] | null | undefined) {
  return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim().length > 0);
}

function readAssessmentTrainingAvailability(
  assessment: OnboardingAssessmentForCompletion,
): string[] | null {
  const rawAnswers = assessment?.raw_answers;
  if (!rawAnswers || typeof rawAnswers !== "object") return null;

  const camelCase = rawAnswers.trainingAvailability;
  if (Array.isArray(camelCase)) {
    return camelCase.filter((item): item is string => typeof item === "string");
  }

  const snakeCase = rawAnswers.training_availability;
  if (Array.isArray(snakeCase)) {
    return snakeCase.filter((item): item is string => typeof item === "string");
  }

  return null;
}

export function isAthleteOnboardingComplete(
  profile: FitnessProfileForOnboarding,
  assessment: OnboardingAssessmentForCompletion,
) {
  if (!profile) return false;

  const trainingAvailability =
    profile.training_availability ?? readAssessmentTrainingAvailability(assessment);

  return (
    hasNonEmptyString(profile.gender) &&
    hasNonEmptyString(profile.date_of_birth) &&
    hasNonEmptyString(profile.primary_goal) &&
    hasNonEmptyString(profile.experience_level) &&
    hasNonEmptyStringArray(trainingAvailability) &&
    hasNonEmptyStringArray(profile.equipment_access) &&
    hasPositiveNumber(profile.height_cm) &&
    hasPositiveNumber(profile.weight_kg) &&
    hasNonEmptyString(assessment?.id ?? null)
  );
}
