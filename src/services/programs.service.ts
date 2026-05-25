import { supabase } from "@/src/lib/supabase";

export type Program = {
  coach_avatar_url: string | null;
  coach_name: string | null;
  created_at: string;
  creator_id: string;
  description: string | null;
  difficulty: string | null;
  duration_weeks: number | null;
  id: string;
  image_url: string | null;
  is_published: boolean;
  is_subscription: boolean;
  price: number;
  title: string;
  vibe_type: string | null;
};

export type ProgramListFilters = {
  creatorId?: string;
  publishedOnly?: boolean;
};

export async function fetchPrograms(filters: ProgramListFilters = {}): Promise<Program[]> {
  let q = supabase
    .from("programs")
    .select("id,creator_id,title,description,price,is_subscription,duration_weeks,difficulty,vibe_type,image_url,is_published,created_at")
    .order("created_at", { ascending: false });

  if (filters.creatorId) q = q.eq("creator_id", filters.creatorId);
  if (filters.publishedOnly) q = q.eq("is_published", true);

  const { data, error } = await q;
  if (error) throw error;

  const rows =
    ((data ?? []) as Array<
      Omit<Program, "coach_avatar_url" | "coach_name">
    >) ?? [];
  if (!rows.length) return [];

  const creatorIds = Array.from(new Set(rows.map((row) => row.creator_id)));
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id,full_name,avatar_url")
    .in("id", creatorIds);
  if (usersError) throw usersError;

  const userMap = new Map(
    (((users ?? []) as Array<{ avatar_url: string | null; full_name: string | null; id: string }>) ?? []).map(
      (user) => [user.id, user],
    ),
  );

  return rows.map((row) => {
    const coach = userMap.get(row.creator_id);
    return {
      ...row,
      coach_avatar_url: coach?.avatar_url ?? null,
      coach_name: coach?.full_name ?? null,
    };
  });
}

export async function fetchProgramById(programId: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from("programs")
    .select("id,creator_id,title,description,price,is_subscription,duration_weeks,difficulty,vibe_type,image_url,is_published,created_at")
    .eq("id", programId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  const row =
    (data as Omit<Program, "coach_avatar_url" | "coach_name"> | null) ?? null;
  if (!row) return null;

  const { data: coach, error: coachError } = await supabase
    .from("users")
    .select("id,full_name,avatar_url")
    .eq("id", row.creator_id)
    .maybeSingle();
  if (coachError && coachError.code !== "PGRST116") throw coachError;

  return {
    ...row,
    coach_avatar_url: (coach as { avatar_url: string | null } | null)?.avatar_url ?? null,
    coach_name: (coach as { full_name: string | null } | null)?.full_name ?? null,
  };
}
