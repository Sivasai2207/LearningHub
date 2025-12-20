-- PHASE 4: SCALE-UP ARCHITECTURE MIGRATION

-- 1. TENANTS & MEMBERSHIPS
CREATE TABLE public.tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

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

-- 2. COHORTS
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

-- 3. UPDATING EXISTING TABLES (Tenant Scoping & Lifecycle)
-- Note: Profiles remain global, but all content has a tenant_id.

ALTER TABLE public.courses ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.courses ADD COLUMN status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE public.courses ADD COLUMN published_at timestamptz;
ALTER TABLE public.courses ADD COLUMN published_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.modules ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.content_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.content_items ADD COLUMN content_source text NOT NULL DEFAULT 'external' CHECK (content_source IN ('external', 'storage'));
ALTER TABLE public.content_items ADD COLUMN storage_path text;
ALTER TABLE public.content_items ADD COLUMN mime_type text;
ALTER TABLE public.content_items ADD COLUMN file_size bigint;

ALTER TABLE public.employee_course_assignments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.audit_logs ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- 4. SEARCH VECTORS (Postgres Full-Text Search)
ALTER TABLE public.courses ADD COLUMN search_vector tsvector;
ALTER TABLE public.modules ADD COLUMN search_vector tsvector;
ALTER TABLE public.content_items ADD COLUMN search_vector tsvector;

CREATE INDEX idx_courses_search ON public.courses USING gin(search_vector);
CREATE INDEX idx_modules_search ON public.modules USING gin(search_vector);
CREATE INDEX idx_content_search ON public.content_items USING gin(search_vector);

-- Trigger Function for Search
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

CREATE TRIGGER tr_courses_search BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();
CREATE TRIGGER tr_modules_search BEFORE INSERT OR UPDATE ON public.modules FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();
CREATE TRIGGER tr_content_search BEFORE INSERT OR UPDATE ON public.content_items FOR EACH ROW EXECUTE PROCEDURE public.update_search_vector();

-- 5. VIEW: Effective Assignments
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

-- 6. INITIAL DATA STAGING
-- Create a default tenant and link everything to it so existing app doesn't break.
INSERT INTO public.tenants (name, slug) VALUES ('Default', 'default') ON CONFLICT DO NOTHING;

DO $$ 
DECLARE 
    def_tenant_id uuid;
BEGIN
    SELECT id INTO def_tenant_id FROM public.tenants WHERE slug = 'default' LIMIT 1;
    
    UPDATE public.courses SET tenant_id = def_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.modules SET tenant_id = def_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.content_items SET tenant_id = def_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.employee_course_assignments SET tenant_id = def_tenant_id WHERE tenant_id IS NULL;
    UPDATE public.audit_logs SET tenant_id = def_tenant_id WHERE tenant_id IS NULL;

    -- Make tenant_id NOT NULL for future safety (conditional if needed, but here simple)
    -- ALTER TABLE public.courses ALTER COLUMN tenant_id SET NOT NULL;
END $$;
