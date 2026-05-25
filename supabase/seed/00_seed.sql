-- Wolfitness modular seed runner
-- Use with psql/supabase db execute that supports meta-commands.
-- If your SQL runner doesn't support \i, execute files in numeric order manually.

begin;

\i supabase/seed/01_users.sql
\i supabase/seed/02_coaches.sql
\i supabase/seed/03_programs.sql
\i supabase/seed/04_exercises_library.sql
\i supabase/seed/05_program_weeks.sql
\i supabase/seed/06_program_days.sql
\i supabase/seed/07_program_exercises.sql
\i supabase/seed/08_athlete_profile_and_onboarding.sql
\i supabase/seed/09_enrollments.sql
\i supabase/seed/10_nutrition.sql
\i supabase/seed/11_workout_sessions.sql
\i supabase/seed/12_workout_log_sets.sql

commit;

