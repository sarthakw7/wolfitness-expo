import { supabase } from "@/src/lib/supabase";

import { clearOnboardingDraft, readOnboardingDraft } from "./onboarding-draft";

/**
 * Commits the locally-stored onboarding draft into Supabase for the authenticated user.
 *
 * This is intentionally "best effort" and only writes fields that map safely to structured columns.
 * Callers should separately mark onboarding complete (local flag) once this succeeds.
 */
export async function commitOnboardingDraftToSupabase(userId: string): Promise<{ committed: boolean }> {
  const draft = await readOnboardingDraft();
  if (!draft) return { committed: false };

  // Minimum fields that ensure we can persist identity baselines.
  if (!draft.gender || !draft.dateOfBirth) {
    return { committed: false };
  }

  // Structured fields (fitness_profiles).
  const { error: profileError } = await supabase.from("fitness_profiles").upsert(
    {
      user_id: userId,
      date_of_birth: draft.dateOfBirth,
      equipment_access: draft.equipmentAccess ? [draft.equipmentAccess] : undefined,
      experience_level: draft.experienceLevel,
      gender: draft.gender,
      height_cm: draft.heightCm ?? undefined,
      injuries: draft.injuries ?? undefined,
      primary_goal: draft.primaryGoal,
      vibe_type: draft.vibeType,
      weight_kg: draft.weightKg ?? undefined,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    throw profileError;
  }

  // Raw answers (onboarding_assessments) for audit/recompute.
  const { error: assessmentError } = await supabase.from("onboarding_assessments").insert({
    user_id: userId,
    raw_answers: draft,
    calculated_vibe: draft.vibeType ?? "unknown",
  });
  if (assessmentError) {
    throw assessmentError;
  }

  await clearOnboardingDraft();
  return { committed: true };
}

