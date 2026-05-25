-- 10_nutrition.sql

insert into public.macro_targets (
  id, user_id, daily_calorie_target, daily_protein_target, daily_carbs_target, daily_fat_target, active_from, active_to
)
values
  ('92000000-0000-0000-0000-000000000001'::uuid, 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 2600, 170, 300, 75, current_date - 30, null)
on conflict (id) do update
set daily_calorie_target = excluded.daily_calorie_target,
    daily_protein_target = excluded.daily_protein_target,
    daily_carbs_target = excluded.daily_carbs_target,
    daily_fat_target = excluded.daily_fat_target,
    active_from = excluded.active_from,
    active_to = excluded.active_to;

insert into public.daily_nutrition_summaries (
  id, user_id, date, total_calories, total_protein, total_carbs, total_fat
)
select
  (
    substr(md5('nutrition:' || gs::text),1,8) || '-' ||
    substr(md5('nutrition:' || gs::text),9,4) || '-' ||
    substr(md5('nutrition:' || gs::text),13,4) || '-' ||
    substr(md5('nutrition:' || gs::text),17,4) || '-' ||
    substr(md5('nutrition:' || gs::text),21,12)
  )::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  (current_date - gs),
  2100 + (gs * 40),
  140 + (gs * 3),
  240 + (gs * 5),
  62 + (gs * 2)
from generate_series(0,6) gs
on conflict (id) do nothing;

