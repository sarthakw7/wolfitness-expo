-- 05_program_weeks.sql

with program_ids as (
  select id as program_id from public.programs
  where id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
weeks as (
  select
    (
      substr(md5(program_id::text || ':week:' || gs::text),1,8) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),9,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),13,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),17,4) || '-' ||
      substr(md5(program_id::text || ':week:' || gs::text),21,12)
    )::uuid as id,
    program_id,
    gs as week_number,
    'Week ' || gs as title
  from program_ids cross join generate_series(1,4) gs
)
insert into public.program_weeks (id, program_id, week_number, title)
select id, program_id, week_number, title from weeks
on conflict (id) do nothing;

