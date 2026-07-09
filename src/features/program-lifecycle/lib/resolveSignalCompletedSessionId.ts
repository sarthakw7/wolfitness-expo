type SignalCompletedSessionRow = {
  active_program_id: string | null;
  completed_at: string | null;
  id: string;
  source_day_key: string | null;
  source_program_id: string | null;
  source_program_version: string | null;
  source_week_key: string | null;
};

type ResolveSignalCompletedSessionIdInput = {
  completedSessions: SignalCompletedSessionRow[] | null | undefined;
  fallbackSessionId?: string | null;
  activeProgramId: string | null;
  programId: string | null;
  programVersion: string | null;
  weekKey: string | null;
  dayKey: string | null;
};

export function resolveSignalCompletedSessionId({
  completedSessions,
  fallbackSessionId,
  activeProgramId,
  programId,
  programVersion,
  weekKey,
  dayKey,
}: ResolveSignalCompletedSessionIdInput) {
  if (!programId || !programVersion || !weekKey || !dayKey || !activeProgramId) return null;

  const exactMatch = (completedSessions ?? []).find(
    (session) =>
      session.completed_at !== null &&
      session.active_program_id === activeProgramId &&
      session.source_program_id === programId &&
      session.source_program_version === programVersion &&
      session.source_week_key === weekKey &&
      session.source_day_key === dayKey,
  );

  if (exactMatch) return exactMatch.id;

  if (!fallbackSessionId) return null;

  const fallbackMatch = (completedSessions ?? []).find(
    (session) =>
      session.id === fallbackSessionId &&
      session.completed_at !== null &&
      session.active_program_id === activeProgramId &&
      session.source_program_id === programId &&
      session.source_program_version === programVersion &&
      session.source_week_key === weekKey &&
      session.source_day_key === dayKey,
  );

  return fallbackMatch?.id ?? null;
}
