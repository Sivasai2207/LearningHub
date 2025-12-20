import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export const getTenantContext = cache(async (slug: string) => {
    const supabase = await createClient()
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, slug, active')
        .eq('slug', slug)
        .single()

    if (error || !tenant || !tenant.active) {
        return null
    }

    // Verify current user membership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('role')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

    if (!membership) return null

    return {
        ...tenant,
        userRole: membership.role
    }
})
