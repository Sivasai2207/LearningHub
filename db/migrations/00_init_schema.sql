-- 1. PROFILES
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null, -- denormalized for easier access
  role text not null check (role in ('admin', 'employee')) default 'employee',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. COURSES
create table public.courses (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. MODULES
create table public.modules (
  id uuid not null default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_modules_course_sort on public.modules(course_id, sort_order);

-- 4. CONTENT ITEMS
create table public.content_items (
  id uuid not null default gen_random_uuid() primary key,
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  url text not null,
  type text check (type in ('youtube', 'pdf', 'ppt', 'link')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_content_module on public.content_items(module_id);

-- 5. TRIGGERS: updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_courses
before update on public.courses
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_modules
before update on public.modules
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_content_items
before update on public.content_items
for each row execute procedure public.handle_updated_at();

-- 6. TRIGGERS: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Employee'),
    new.email,
    'employee', -- default role
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger checks: active on auth.users is distinct from our profiles.active
-- This trigger runs on auth.users insert
-- Note: 'auth' schema is usually protected. We need to run this as superuser or equivalent in SQL editor.
-- We assume this migration runs with sufficient privs.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 7. RLS POLICIES
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.content_items enable row level security;

-- Helper function for admin check
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
    and active = true
  );
end;
$$ language plpgsql security definer;

-- PROFILES Policies
-- Self read
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admin read all
create policy "Admins can view all profiles" on public.profiles
  for select using (public.is_admin());

-- Admin update (role/active) - Note: separate logic if we want users to update own name? 
-- Phase 1 simple: Admin can update any profile.
create policy "Admins can update profiles" on public.profiles
  for update using (public.is_admin());

-- COURSES Policies
-- Admin full access
create policy "Admins full access courses" on public.courses
  for all using (public.is_admin());
-- Employee NO access (Phase 1)
-- (No policy = deny by default)

-- MODULES Policies
create policy "Admins full access modules" on public.modules
  for all using (public.is_admin());

-- CONTENT_ITEMS Policies
create policy "Admins full access content_items" on public.content_items
  for all using (public.is_admin());

-- SEED: First Admin
-- (This is usually done manually via SQL editor because we can't insert into auth.users easily from here without extension or knowing the ID)
-- We will provide a separate seed instructions file.
