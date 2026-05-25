-- 08_athlete_profile_and_onboarding.sql

insert into public.fitness_profiles (
  user_id, gender, date_of_birth, height_cm, weight_kg,
  primary_goal, experience_level, equipment_access, injuries, vibe_type
)
values
  ('d39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 'male', '1996-05-18', 178, 78.5,
   'build_muscle', 'intermediate', array['full_gym'], array[]::text[], 'power')
on conflict (user_id) do update
set gender = excluded.gender,
    date_of_birth = excluded.date_of_birth,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    primary_goal = excluded.primary_goal,
    experience_level = excluded.experience_level,
    equipment_access = excluded.equipment_access,
    injuries = excluded.injuries,
    vibe_type = excluded.vibe_type;

insert into public.onboarding_assessments (id, user_id, raw_answers, calculated_vibe)
values (
  '90000000-0000-0000-0000-000000000001'::uuid,
  'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid,
  jsonb_build_object(
    'gender','male',
    'dateOfBirth','1996-05-18',
    'heightCm',178,
    'weightKg',78.5,
    'primaryGoal','build_muscle',
    'experienceLevel','intermediate',
    'equipmentAccess','full_gym',
    'injuries',jsonb_build_array(),
    'vibeType','power',
    'vibeMetrics',jsonb_build_object('power',82,'endurance',57,'mobility',52)
  ),
  'power'
)
on conflict (id) do nothing;

