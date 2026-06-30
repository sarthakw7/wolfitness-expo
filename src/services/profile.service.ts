import type { User } from "@supabase/supabase-js";

import { supabase } from "@/src/lib/supabase";

export type PublicUserProfile = {
  avatar_url: string | null;
  email: string | null;
  full_name: string | null;
  id: string;
  role: string | null;
  username: string | null;
};

export type FitnessProfile = {
  date_of_birth: string | null;
  equipment_access: string[] | null;
  experience_level: string | null;
  gender: string | null;
  height_cm: number | null;
  injuries: string[] | null;
  primary_goal: string | null;
  training_availability: string[] | null;
  user_id: string;
  vibe_type: string | null;
  weight_kg: number | null;
};

export type ProfileBundle = {
  authUser: User;
  fitnessProfile: FitnessProfile | null;
  publicProfile: PublicUserProfile | null;
};

export type UpdateProfileInput = {
  // Auth metadata
  fullName?: string;
  avatarUrl?: string;
  username?: string;

  // fitness_profiles fields (optional patch)
  heightCm?: number | null;
  weightKg?: number | null;
  primaryGoal?: string | null;
  experienceLevel?: string | null;
  equipmentAccess?: string[] | null;
  injuries?: string[] | null;
  trainingAvailability?: string[] | null;
  vibeType?: string | null;
};

export async function fetchProfileBundle(userId: string): Promise<Pick<ProfileBundle, "fitnessProfile" | "publicProfile">> {
  const [publicRes, fitnessRes] = await Promise.all([
    supabase
      .from("users")
      .select("id,email,full_name,username,avatar_url,role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("fitness_profiles")
      .select(
        "user_id,gender,date_of_birth,height_cm,weight_kg,primary_goal,experience_level,training_availability,equipment_access,injuries,vibe_type",
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (publicRes.error && publicRes.status !== 406) throw publicRes.error;
  if (fitnessRes.error && fitnessRes.status !== 406) throw fitnessRes.error;

  return {
    fitnessProfile: (fitnessRes.data as FitnessProfile | null) ?? null,
    publicProfile: (publicRes.data as PublicUserProfile | null) ?? null,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<void> {
  // Auth metadata is the most reliable place to store basic identity fields (works across providers).
  const authPatch: Record<string, string> = {};
  if (typeof input.fullName === "string") authPatch.full_name = input.fullName.trim();
  if (typeof input.avatarUrl === "string") authPatch.avatar_url = input.avatarUrl.trim();
  if (typeof input.username === "string") authPatch.username = input.username.trim();

  if (Object.keys(authPatch).length > 0) {
    const { error } = await supabase.auth.updateUser({ data: authPatch });
    if (error) throw error;
  }

  // Best-effort: update public.users row (may be blocked by RLS; ignore if it fails).
  const publicPatch: Partial<PublicUserProfile> = {};
  if (typeof input.fullName === "string") publicPatch.full_name = input.fullName.trim();
  if (typeof input.avatarUrl === "string") publicPatch.avatar_url = input.avatarUrl.trim();
  if (typeof input.username === "string") publicPatch.username = input.username.trim();
  if (Object.keys(publicPatch).length > 0) {
    await supabase.from("users").update(publicPatch).eq("id", userId);
  }

  // fitness_profiles patch (structured metrics)
  const fitnessPatch: Partial<FitnessProfile> = {};
  if ("heightCm" in input) fitnessPatch.height_cm = input.heightCm ?? null;
  if ("weightKg" in input) fitnessPatch.weight_kg = input.weightKg ?? null;
  if ("primaryGoal" in input) fitnessPatch.primary_goal = input.primaryGoal ?? null;
  if ("experienceLevel" in input) fitnessPatch.experience_level = input.experienceLevel ?? null;
  if ("trainingAvailability" in input) fitnessPatch.training_availability = input.trainingAvailability ?? null;
  if ("equipmentAccess" in input) fitnessPatch.equipment_access = input.equipmentAccess ?? null;
  if ("injuries" in input) fitnessPatch.injuries = input.injuries ?? null;
  if ("vibeType" in input) fitnessPatch.vibe_type = input.vibeType ?? null;

  if (Object.keys(fitnessPatch).length > 0) {
    const { error } = await supabase
      .from("fitness_profiles")
      .upsert({ user_id: userId, ...fitnessPatch }, { onConflict: "user_id" });
    if (error) throw error;
  }
}

export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const ext = localUri.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, blob, {
      cacheControl: "3600",
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("Unable to resolve uploaded avatar URL.");
  }
  return data.publicUrl;
}
