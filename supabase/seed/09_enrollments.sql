-- 09_enrollments.sql

insert into public.enrollments (id, user_id, program_id, status, enrolled_at, expires_at)
values
  ('91000000-0000-0000-0000-000000000001'::uuid, 'd39c5500-4d79-4584-ba85-2b6529f39162'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'active', now() - interval '10 days', null)
on conflict (id) do update
set status = excluded.status,
    enrolled_at = excluded.enrolled_at,
    expires_at = excluded.expires_at;

