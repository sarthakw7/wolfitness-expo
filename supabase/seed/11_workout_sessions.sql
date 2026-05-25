-- 11_workout_sessions.sql

with target_days as (
  select pd.id as day_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id = '10000000-0000-0000-0000-000000000001'::uuid
  order by pw.week_number, pd.day_number
  limit 10
),
completed_sessions as (
  select
    (
      substr(md5('session:completed:' || row_number() over()::text),1,8) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),9,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),13,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),17,4) || '-' ||
      substr(md5('session:completed:' || row_number() over()::text),21,12)
    )::uuid as id,
    row_number() over() as rn,
    td.day_id
  from target_days td
)
insert into public.workout_sessions (id, user_id, program_id, day_id, started_at, completed_at, notes)
select
  cs.id,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  cs.day_id,
  now() - ((11 - cs.rn) || ' days')::interval - interval '70 minutes',
  now() - ((11 - cs.rn) || ' days')::interval,
  'Completed seeded workout session'
from completed_sessions cs
on conflict (id) do nothing;

with todays_day as (
  select pd.id as day_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id = '10000000-0000-0000-0000-000000000001'::uuid
  order by pw.week_number, pd.day_number
  limit 1
)
insert into public.workout_sessions (id, user_id, program_id, day_id, started_at, completed_at, notes)
select
  '93000000-0000-0000-0000-000000000001'::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  td.day_id,
  now() - interval '20 minutes',
  null,
  'Open session for resume testing'
from todays_day td
on conflict (id) do update
set completed_at = null,
    started_at = excluded.started_at,
    notes = excluded.notes;

