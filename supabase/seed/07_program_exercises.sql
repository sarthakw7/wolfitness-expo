-- 07_program_exercises.sql

with day_rows as (
  select pd.id as day_id, pd.day_number, pw.week_number, pw.program_id
  from public.program_days pd
  join public.program_weeks pw on pw.id = pd.week_id
  where pw.program_id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
slots as (
  select generate_series(1,5) as slot
),
exercise_pool as (
  select
    id as exercise_id,
    row_number() over(order by id) as rn,
    count(*) over() as total
  from public.exercises_library
  where id between '20000000-0000-0000-0000-000000000001'::uuid and '20000000-0000-0000-0000-000000000036'::uuid
),
mapped as (
  select
    (
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),1,8) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),9,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),13,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),17,4) || '-' ||
      substr(md5(dr.day_id::text || ':slot:' || s.slot::text),21,12)
    )::uuid as id,
    dr.day_id,
    ep.exercise_id as exercise_library_id,
    case
      when dr.day_number = 1 and s.slot <= 2 then 4
      when dr.day_number = 2 and s.slot <= 2 then 3
      else 3
    end as target_sets,
    case
      when dr.day_number = 1 then '6-8'
      when dr.day_number = 2 then '8-12'
      else '10-15'
    end as target_reps,
    null::numeric as target_rpe,
    case when s.slot <= 2 then 120 else 75 end as rest_seconds,
    'Seeded protocol movement.'::text as notes,
    s.slot as order_index
  from day_rows dr
  cross join slots s
  join lateral (
    select exercise_id
    from exercise_pool
    where rn = ((abs(hashtext(dr.day_id::text || ':' || s.slot::text)) % (select max(total) from exercise_pool)) + 1)
  ) ep on true
)
insert into public.program_exercises (
  id, day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, notes, order_index
)
select id, day_id, exercise_library_id, target_sets, target_reps, target_rpe, rest_seconds, notes, order_index
from mapped
on conflict (id) do nothing;

