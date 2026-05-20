import { supabase } from "@/src/lib/supabase";

export type Program = {
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
  return (data as Program[]) ?? [];
}

export async function fetchProgramById(programId: string): Promise<Program | null> {
  const { data, error } = await supabase
    .from("programs")
    .select("id,creator_id,title,description,price,is_subscription,duration_weeks,difficulty,vibe_type,image_url,is_published,created_at")
    .eq("id", programId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data as Program | null) ?? null;
}

