-- Phase 2 RLS Policies
-- Requirement: Strict Access Control based on Assignments

-- 1. Helper Functions (Security Definer to bypass RLS for internal checks if needed)
-- We already have `is_admin()`.

create or replace function public.is_active_user()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and active = true
  );
end;
$$ language plpgsql security definer;

-- 2. ASSIGNMENTS TABLE POLICIES
-- Admin: Full Access
create policy "Admins full access assignments" on public.employee_course_assignments
  for all using (public.is_admin());

-- Employee: Read OWN assignments only
create policy "Employees view own assignments" on public.employee_course_assignments
  for select using (
    auth.uid() = employee_id
    and public.is_active_user()
  );

-- 3. UPDATING COURSE/MODULE/CONTENT POLICIES
-- We need to DROP existing "Employee NO ACCESS" assumptions by adding permissive policies for them IF assigned.
-- Note: Admin policies from Phase 1 (admin_all) still hold and cover everything. We just ADD employee policies.

-- COURSES
-- Employee can select course IF it is assigned to them
create policy "Employees view assigned courses" on public.courses
  for select using (
    exists (
      select 1 from public.employee_course_assignments a
      where a.course_id = public.courses.id
      and a.employee_id = auth.uid()
    )
    and public.is_active_user()
  );

-- MODULES
-- Employee can select module IF it belongs to an assigned course
create policy "Employees view assigned modules" on public.modules
  for select using (
    exists (
      select 1 from public.employee_course_assignments a
      where a.course_id = public.modules.course_id
      and a.employee_id = auth.uid()
    )
    and public.is_active_user()
  );

-- CONTENT ITEMS
-- Employee can select content IF it belongs to an assigned module
-- This requires a join or nested exist. 
-- Efficient way: content -> module -> course -> assignment
create policy "Employees view assigned content" on public.content_items
  for select using (
    exists (
      select 1 
      from public.modules m
      join public.employee_course_assignments a on a.course_id = m.course_id
      where m.id = public.content_items.module_id
      and a.employee_id = auth.uid()
    )
    and public.is_active_user()
  );

-- 4. PROFILES
-- Ensure `active` check is reinforced on profiles? 
-- Phase 1 allowed "Users can view own profile".
-- We might want to restrict viewing own profile if inactive?
-- "Any access should also respect profiles.active = true."
-- The simple policies above `and public.is_active_user()` handle the data access.
-- Middleware handles the login gating.
