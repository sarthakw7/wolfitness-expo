-- 02_coaches.sql

insert into public.coaches (id, specializations, years_experience, headline, is_verified)
values
  ('f786865d-ede0-4307-8836-337b858a5e05'::uuid, array['Strength','Hypertrophy'], 9, 'Performance-first strength systems.', true),
  ('9c37d428-0931-4920-b686-6e78f21e5786'::uuid, array['Conditioning','Fat Loss'], 7, 'Conditioning with measurable progression.', true),
  ('2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, array['Mobility','Athletic Performance'], 11, 'Resilient movement and power transfer.', true)
on conflict (id) do update
set specializations = excluded.specializations,
    years_experience = excluded.years_experience,
    headline = excluded.headline,
    is_verified = excluded.is_verified;

