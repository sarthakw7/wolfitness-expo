-- 12_workout_log_sets.sql

with completed as (
  select id as session_id, day_id
  from public.workout_sessions
  where user_id = 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid
    and completed_at is not null
  order by completed_at desc
  limit 10
),
day_ex as (
  select c.session_id, pe.exercise_library_id, pe.order_index
  from completed c
  join public.program_exercises pe on pe.day_id = c.day_id
  where pe.order_index <= 3
),
set_rows as (
  select
    (
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),1,8) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),9,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),13,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),17,4) || '-' ||
      substr(md5(session_id::text || ':' || exercise_library_id::text || ':set:' || s::text),21,12)
    )::uuid as id,
    session_id,
    exercise_library_id,
    s as set_number,
    (8 + ((order_index + s) % 5))::int as reps_completed,
    (40 + (order_index * 5) + (s * 2))::numeric as weight_kg,
    (7 + (s % 2))::numeric as rpe_actual
  from day_ex
  cross join generate_series(1,3) s
)
insert into public.workout_log_sets (
  id, session_id, exercise_library_id, set_number, reps_completed, weight_kg, rpe_actual, logged_at
)
select id, session_id, exercise_library_id, set_number, reps_completed, weight_kg, rpe_actual, now() - interval '1 day'
from set_rows
on conflict (id) do nothing;

