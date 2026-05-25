-- 06_program_days.sql

with weeks as (
  select id as week_id
  from public.program_weeks
  where program_id between '10000000-0000-0000-0000-000000000001'::uuid and '10000000-0000-0000-0000-000000000008'::uuid
),
days as (
  select
    (
      substr(md5(week_id::text || ':day:' || d::text),1,8) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),9,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),13,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),17,4) || '-' ||
      substr(md5(week_id::text || ':day:' || d::text),21,12)
    )::uuid as id,
    week_id,
    d as day_number,
    case d when 1 then 'Day 1 - Lower/Push' when 2 then 'Day 2 - Pull/Conditioning' else 'Day 3 - Mixed' end as title
  from weeks cross join generate_series(1,3) d
)
insert into public.program_days (id, week_id, day_number, title)
select id, week_id, day_number, title from days
on conflict (id) do nothing;

