-- 01_users.sql
-- IMPORTANT: replace IDs with real auth.users IDs in production.

with seed_people as (
  select *
  from (
    values
      ('f786865d-ede0-4307-8836-337b858a5e05'::uuid, 'coach1@wolfitness.app'::text, 'Coach Aria Stone'::text, 'coach'::text),
      ('9c37d428-0931-4920-b686-6e78f21e5786'::uuid, 'coach2@wolfitness.app'::text, 'Coach Noah Vale'::text, 'coach'::text),
      ('2c153cd4-25c5-4a8a-9c53-cc2bbf4025d0'::uuid, 'coach3@wolfitness.app'::text, 'Coach Mira Cross'::text, 'coach'::text),
      ('d39c5500-4d79-4584-ba85-2b6529f39162'::uuid, 'athlete@wolfitness.app'::text, 'Alex Athlete'::text, 'client'::text)
  ) as t(id, email, full_name, role)
)
insert into public.users (id, email, full_name, role)
select id, email, full_name, role::wff_role
from seed_people
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

