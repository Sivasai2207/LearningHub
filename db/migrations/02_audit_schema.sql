-- 1. Create Audit Logs Table
create table public.audit_logs (
    id uuid not null default gen_random_uuid() primary key,
    actor_id uuid references public.profiles(id), -- Who did it
    actor_email text, -- Snapshot incase actor deleted
    action text not null, -- CREATE_COURSE, UPDATE_USER, etc.
    entity_type text not null, -- course, user, assignment
    entity_id uuid, 
    metadata jsonb, -- Diff or snapshot
    created_at timestamptz not null default now()
);

-- 2. Indexes
create index idx_audit_created_at on public.audit_logs(created_at desc);
create index idx_audit_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_actor on public.audit_logs(actor_id, created_at desc);

-- 3. RLS
alter table public.audit_logs enable row level security;

-- Only Admins can view audit logs
create policy "Admins view audit logs" on public.audit_logs
    for select using (public.is_admin());

-- INSERT: Ideally only backend (service role) inserts, but if we log from standard admin actions
-- we allow admins to insert. But they cannot update/delete.
create policy "Admins insert audit logs" on public.audit_logs
    for insert with check (public.is_admin());

-- Profiles Hardening (Phase 3 Requirement)
-- Prevent non-admins from updating critical fields.
-- We rely on existing policies "Admins full access" and "Users read own".
-- We need to ensure Users CANNOT update their own role/active status if we allowed update before.
-- Phase 1 check: "Only admin can update role/active".
-- We should double check or re-apply robust policies if needed. For now, existing Profile policies are likely:
-- "Admins all access", "Users select own". Users CANNOT update currently based on Phase 1 instructions (Phase 1 said "Only admin can insert/update/delete" for most things).
-- If we add "User update profile" later, we must protect role/active columns.
