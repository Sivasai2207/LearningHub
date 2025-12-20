'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ROUTES } from '@/lib/config/routes'

export async function createFirstTenant(formData: FormData) {
    const supabase = await createClient()
    const adminClient = createServiceRoleClient()

    const companyName = formData.get('companyName') as string
    const companySlug = formData.get('companySlug') as string

    if (!companyName || !companySlug) {
        return { error: 'Company name and slug are required' }
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(companySlug)) {
        return { error: 'Slug must contain only lowercase letters, numbers, and hyphens' }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { error: 'You must be logged in to create a company' }
    }

    // Check if user already has a tenant
    const { data: existingMembership } = await adminClient
        .from('tenant_memberships')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (existingMembership) {
        return { error: 'You already belong to a company. Contact support if you need help.' }
    }

    // Check if slug is available
    const { data: existingTenant } = await adminClient
        .from('tenants')
        .select('id')
        .eq('slug', companySlug)
        .single()

    if (existingTenant) {
        return { error: 'This company slug is already taken. Please choose another.' }
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .insert({
            name: companyName,
            slug: companySlug,
            active: true
        })
        .select()
        .single()

    if (tenantError || !tenant) {
        return { error: 'Failed to create company: ' + tenantError?.message }
    }

    // Add user as owner
    const { error: membershipError } = await adminClient
        .from('tenant_memberships')
        .insert({
            tenant_id: tenant.id,
            user_id: user.id,
            role: 'owner',
            active: true
        })

    if (membershipError) {
        // Rollback: delete the tenant
        await adminClient.from('tenants').delete().eq('id', tenant.id)
        return { error: 'Failed to create membership: ' + membershipError.message }
    }

    // Update user profile to admin role
    await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

    revalidatePath(ROUTES.home, 'layout')
    return { success: true, tenantSlug: companySlug }
}
