-- ==========================================
-- COMPREHENSIVE SCHEMA INITIALIZATION
-- Employee Learning Hub (Phases 1-4)
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CORE TABLES

-- PROFILES (Global users)
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- TENANTS
CREATE TABLE public.tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- TENANT MEMBERSHIPS
CREATE TABLE public.tenant_memberships (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'trainer', 'employee')),
    active boolean NOT NULL DEFAULT true,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);
CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant_role ON public.tenant_memberships(tenant_id, role);

-- COURSES
CREATE TABLE public.courses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at timestamptz,
    published_by uuid REFERENCES public.profiles(id),
    search_vector tsvector,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_tenant ON public.courses(tenant_id);
CREATE INDEX idx_courses_search ON public.courses USING gin(search_vector);

-- MODULES
CREATE TABLE public.modules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    sort_order int NOT NULL DEFAULT 0,
    search_vector tsvector,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_modules_course_sort ON public.modules(course_id, sort_order);
CREATE INDEX idx_modules_tenant ON public.modules(tenant_id);
CREATE INDEX idx_modules_search ON public.modules USING gin(search_vector);

-- CONTENT ITEMS
CREATE TABLE public.content_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title text NOT NULL,
    url text, -- Nullable for storage-based content
    type text CHECK (type IN ('youtube', 'pdf', 'ppt', 'link', 'video', 'image')),
    content_source text NOT NULL DEFAULT 'external' CHECK (content_source IN ('external', 'storage')),
    storage_path text,
    mime_type text,
    file_size bigint,
    search_vector tsvector,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_module ON public.content_items(module_id);
CREATE INDEX idx_content_tenant ON public.content_items(tenant_id);
CREATE INDEX idx_content_search ON public.content_items USING gin(search_vector);

-- EMPLOYEE COURSE ASSIGNMENTS (Individual)
CREATE TABLE public.employee_course_assignments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (employee_id, course_id)
);
CREATE INDEX idx_assignments_employee ON public.employee_course_assignments(employee_id);
CREATE INDEX idx_assignments_course ON public.employee_course_assignments(course_id);
CREATE INDEX idx_assignments_tenant ON public.employee_course_assignments(tenant_id);

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES public.profiles(id),
    actor_email text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at desc);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id, created_at desc);

-- COHORTS
CREATE TABLE public.cohorts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, name)
);
CREATE INDEX idx_cohorts_tenant ON public.cohorts(tenant_id);

CREATE TABLE public.cohort_members (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    added_at timestamptz DEFAULT now(),
    UNIQUE(cohort_id, employee_id)
);
CREATE INDEX idx_cohort_members_employee ON public.cohort_members(employee_id);

CREATE TABLE public.cohort_course_assignments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now(),
    assigned_by uuid REFERENCES public.profiles(id),
    UNIQUE(cohort_id, course_id)
);

-- 3. FUNCTIONS & TRIGGERS

-- UPDATED_AT Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Apply UPDATED_AT triggers
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_tenants BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_courses BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_modules BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_content_items BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER set_updated_at_cohorts BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- SEARCH VECTOR Trigger Function
CREATE OR REPLACE FUNCTION public.update_search_vector() RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'courses' THEN
    NEW.search_vector = setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') || 
                        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  ELSIF TG_TABLE_NAME = 'modules' THEN
    NEW.search_vector = setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') || 
                        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  ELSIF TG_TABLE_NAME = 'content_items' THEN
    NEW.search_vector = setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply SEARCH VECTOR triggers
CREATE TRIGGER tr_courses_search BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();
CREATE TRIGGER tr_modules_search BEFORE INSERT OR UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();
CREATE TRIGGER tr_content_search BEFORE INSERT OR UPDATE ON public.content_items FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();

-- NEW USER Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, active)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Employee'),
    new.email,
    'employee',
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. VIEWS

-- Effective Assignments (Individual + Cohort)
CREATE OR REPLACE VIEW public.v_employee_effective_courses AS
SELECT 
    p.id as employee_id,
    c.id as course_id,
    c.tenant_id,
    c.title as course_title,
    c.status as course_status,
    c.description
FROM public.profiles p
JOIN public.employee_course_assignments eca ON eca.employee_id = p.id
JOIN public.courses c ON c.id = eca.course_id
WHERE c.status = 'published'
UNION
SELECT 
    cm.employee_id,
    cca.course_id,
    cca.tenant_id,
    c.title,
    c.status,
    c.description
FROM public.cohort_members cm
JOIN public.cohort_course_assignments cca ON cca.cohort_id = cm.cohort_id
JOIN public.courses c ON c.id = cca.course_id
WHERE c.status = 'published';

-- 5. SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_course_assignments ENABLE ROW LEVEL SECURITY;

-- Helper: Is Global Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Is Member of Tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = target_tenant_id
    AND user_id = auth.uid()
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Has Tenant Role
CREATE OR REPLACE FUNCTION public.has_tenant_role(target_tenant_id uuid, required_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = target_tenant_id
    AND user_id = auth.uid()
    AND active = true
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Tenants
CREATE POLICY "Users view joined tenants" ON public.tenants FOR SELECT USING (public.is_tenant_member(id));
CREATE POLICY "Admins full access tenants" ON public.tenants FOR ALL USING (public.is_admin());

-- Memberships
CREATE POLICY "View own memberships" ON public.tenant_memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Tenant admins manage memberships" ON public.tenant_memberships FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- Courses
CREATE POLICY "Tenant admins manage courses" ON public.courses FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'trainer']));
CREATE POLICY "Employees view assigned courses" ON public.courses FOR SELECT USING (
    status = 'published' AND EXISTS (
        SELECT 1 FROM public.v_employee_effective_courses v
        WHERE v.course_id = public.courses.id AND v.employee_id = auth.uid()
    )
);

-- Modules & Content
CREATE POLICY "Tenant admins manage modules" ON public.modules FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'trainer']));
CREATE POLICY "Employees view assigned modules" ON public.modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.v_employee_effective_courses v WHERE v.course_id = public.modules.course_id AND v.employee_id = auth.uid())
);

CREATE POLICY "Tenant admins manage content" ON public.content_items FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'trainer']));
CREATE POLICY "Employees view assigned content" ON public.content_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.v_employee_effective_courses v ON v.course_id = m.course_id
        WHERE m.id = public.content_items.module_id AND v.employee_id = auth.uid()
    )
);

-- Assignments
CREATE POLICY "Tenant admins manage assignments" ON public.employee_course_assignments FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin', 'trainer']));
CREATE POLICY "View own assignments" ON public.employee_course_assignments FOR SELECT USING (employee_id = auth.uid());

-- Audit Logs
CREATE POLICY "Tenant admins view audit" ON public.audit_logs FOR SELECT USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));
CREATE POLICY "Tenant admins insert audit" ON public.audit_logs FOR INSERT WITH CHECK (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));

-- Cohorts
CREATE POLICY "Tenant admins manage cohorts" ON public.cohorts FOR ALL USING (public.has_tenant_role(tenant_id, ARRAY['owner', 'admin']));
CREATE POLICY "Cohort members view cohorts" ON public.cohorts FOR SELECT USING (public.is_tenant_member(tenant_id));

-- 6. SEED DATA

-- Create a bridge for the first admin (Manual Step Required in auth.users)
-- After user sign up, they will be auto-added to profiles.
-- Then you need to run:
-- INSERT INTO public.tenants (name, slug) VALUES ('Default Company', 'default');
-- INSERT INTO public.tenant_memberships (tenant_id, user_id, role) 
-- VALUES ((SELECT id FROM tenants WHERE slug = 'default'), 'USER_UUID_HERE', 'owner');
