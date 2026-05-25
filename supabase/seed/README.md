# Wolfitness Seed Modules

FK-safe execution order:

1. `01_users.sql`
2. `02_coaches.sql`
3. `03_programs.sql`
4. `04_exercises_library.sql`
5. `05_program_weeks.sql`
6. `06_program_days.sql`
7. `07_program_exercises.sql`
8. `08_athlete_profile_and_onboarding.sql`
9. `09_enrollments.sql`
10. `10_nutrition.sql`
11. `11_workout_sessions.sql`
12. `12_workout_log_sets.sql`

Or run `00_seed.sql` if your SQL runner supports `\i`.

## Required prep

- Create real auth users first (3 coaches + 1 athlete).
- Replace hardcoded UUIDs in `01_users.sql` (and related files) with real `auth.users.id` values.

## Quick verification

```sql
select count(*) from public.programs where is_published = true;
select count(*) from public.program_weeks;
select count(*) from public.program_days;
select count(*) from public.program_exercises;
select count(*) from public.workout_sessions where completed_at is null;
```

