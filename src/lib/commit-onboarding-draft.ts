import { supabase } from "@/src/lib/supabase";

import { clearOnboardingDraft, readOnboardingDraft } from "./onboarding-draft";

function debugOnboarding(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

/**
 * Commits the locally-stored onboarding draft into Supabase for the authenticated user.
 *
 * This is intentionally "best effort" and only writes fields that map safely to structured columns.
 * Callers should separately mark onboarding complete (local flag) once this succeeds.
 */
export async function commitOnboardingDraftToSupabase(userId: string): Promise<{ committed: boolean }> {
  debugOnboarding("onboarding commit start", { userId });
  const draft = await readOnboardingDraft();
  if (!draft) {
    debugOnboarding("onboarding commit skipped: no draft", { userId });
    return { committed: false };
  }

  // Minimum fields that ensure we can persist identity baselines.
  if (!draft.gender || !draft.dateOfBirth) {
    if (__DEV__) {
      console.warn("[auth-debug] onboarding commit skipped: incomplete draft", {
        hasDateOfBirth: Boolean(draft.dateOfBirth),
        hasGender: Boolean(draft.gender),
        userId,
      });
    }
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
      training_availability: draft.trainingAvailability ?? undefined,
      vibe_type: draft.vibeType,
      weight_kg: draft.weightKg ?? undefined,
    },
    { onConflict: "user_id" },
  );
  if (profileError) {
    console.warn("[auth-debug] fitness profile persistence failed", {
      error: profileError.message,
      userId,
    });
    throw profileError;
  }
  debugOnboarding("fitness profile persisted", { userId });

  // Raw answers (onboarding_assessments) for audit/recompute.
  const { error: assessmentError } = await supabase.from("onboarding_assessments").insert({
    user_id: userId,
    raw_answers: draft,
    calculated_vibe: draft.vibeType ?? "unknown",
  });
  if (assessmentError) {
    console.warn("[auth-debug] onboarding assessment persistence failed", {
      error: assessmentError.message,
      userId,
    });
    throw assessmentError;
  }
  debugOnboarding("onboarding assessment persisted", { userId });

  await clearOnboardingDraft();
  debugOnboarding("onboarding commit end", { userId });
  return { committed: true };
}
