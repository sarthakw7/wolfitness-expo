-- 03_programs.sql

insert into public.programs (
  id, creator_id, title, description, price, is_subscription,
  duration_weeks, difficulty, vibe_type, image_url, is_published, version_number
)
values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Strength Foundation', 'Build foundational strength with progressive overload.', 49, false, 4, 'beginner', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000002'::uuid, '9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'Fat Loss Conditioning', 'High-compliance conditioning and calorie burn.', 59, false, 4, 'beginner', 'endurance', null, true, 1),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Hypertrophy Split', 'Muscle-focused split with volume control.', 79, false, 4, 'intermediate', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000004'::uuid, '2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'Mobility & Recovery', 'Restore range, improve control, reduce pain risk.', 39, false, 4, 'beginner', 'mobility', null, true, 1),
  ('10000000-0000-0000-0000-000000000005'::uuid, '2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'Athletic Performance', 'Power, speed, and force transfer for sport.', 99, false, 4, 'advanced', 'power', null, true, 1),
  ('10000000-0000-0000-0000-000000000006'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Beginner Strength', 'Simple full-body barbell progression.', 45, false, 4, 'beginner', 'balanced', null, true, 1),
  ('10000000-0000-0000-0000-000000000007'::uuid, '9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'Functional Fitness', 'Work capacity, movement patterns, real-world carryover.', 69, false, 4, 'intermediate', 'endurance', null, true, 1),
  ('10000000-0000-0000-0000-000000000008'::uuid, 'f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'Lean Muscle Accelerator', 'Add lean mass without excess fatigue.', 89, false, 4, 'advanced', 'power', null, true, 1)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    price = excluded.price,
    duration_weeks = excluded.duration_weeks,
    difficulty = excluded.difficulty,
    vibe_type = excluded.vibe_type,
    is_published = excluded.is_published;

