-- SEED DATA FOR PHASE 2 TESTING

-- 1. Create 2 Employees (Simulated)
-- NOTE: In real Supabase, you must create Auth Users first.
-- This script assumes auth users with specific IDs exist or inserts placeholders if you are running locally without auth constraints.
-- SINCE WE CANNOT INSERT INTO AUTH.USERS FROM HERE EASILY, WE ASSUME YOU CREATED THEM.

-- Insert into PROFILES (if not triggered)
-- But triggers are on. So we rely on you creating users:
-- employee1@test.com
-- employee2@test.com

-- 2. Create Dummy Courses (if empty)
insert into public.courses (title, description)
values 
('Security Awareness 101', 'Basic security training for all staff'),
('Advanced React Patterns', 'Deep dive into React development')
on conflict do nothing;

-- 3. Assignments
-- We need IDs to insert assignments.
-- This is a template for the user to run in SQL Editor after finding IDs.

-- ASSIGN "Security Awareness" to Employee 1
-- insert into public.employee_course_assignments (employee_id, course_id)
-- select p.id, c.id
-- from public.profiles p, public.courses c
-- where p.email = 'employee1@test.com' and c.title = 'Security Awareness 101'
-- on conflict do nothing;

-- ASSIGN "Advanced React" to Employee 2
-- insert into public.employee_course_assignments (employee_id, course_id)
-- select p.id, c.id
-- from public.profiles p, public.courses c
-- where p.email = 'employee2@test.com' and c.title = 'Advanced React Patterns'
-- on conflict do nothing;
