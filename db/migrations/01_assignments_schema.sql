-- 1. Create Assignments Table
create table public.employee_course_assignments (
  id uuid not null default gen_random_uuid() primary key,
  employee_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  assigned_at timestamptz not null default now()
);

-- 2. Constraints & Indexes
alter table public.employee_course_assignments
  add constraint employee_course_unique unique (employee_id, course_id);

create index idx_assignments_employee on public.employee_course_assignments(employee_id);
create index idx_assignments_course on public.employee_course_assignments(course_id);

-- 3. Enable RLS
alter table public.employee_course_assignments enable row level security;
