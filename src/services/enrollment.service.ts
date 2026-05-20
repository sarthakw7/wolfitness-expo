import { supabase } from "@/src/lib/supabase";

export type EnrollmentStatus = "active" | "canceled" | "expired" | "paused" | string;

export type Enrollment = {
  enrolled_at: string;
  expires_at: string | null;
  id: string;
  program_id: string;
  status: EnrollmentStatus;
  stripe_subscription_id: string | null;
  user_id: string;
};

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id,user_id,program_id,status,stripe_subscription_id,enrolled_at,expires_at")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return (data as Enrollment[]) ?? [];
}

export async function enrollInProgram(input: { programId: string; userId: string }): Promise<Enrollment> {
  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      program_id: input.programId,
      user_id: input.userId,
      status: "active",
    })
    .select("id,user_id,program_id,status,stripe_subscription_id,enrolled_at,expires_at")
    .single();

  if (error) throw error;
  return data as Enrollment;
}

