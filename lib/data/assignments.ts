// FETCHERS FOR SERVER COMPONENTS
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function getEmployees(tenantId: string) {
    const supabase = await createServerClient()
    // Join with memberships to get ONLY employees in THIS tenant
    const { data } = await supabase
        .from('profiles')
        .select('*, tenant_memberships!inner(tenant_id, role)')
        .eq('tenant_memberships.tenant_id', tenantId)
        .eq('tenant_memberships.role', 'employee')
        .order('full_name')
    return data || []
}

export async function getCourses(tenantId: string) {
    const supabase = await createServerClient()
    const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('title')
    return data || []
}
