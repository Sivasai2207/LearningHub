import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { SITE_URL, ROUTES } from '@/lib/config/routes'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? ROUTES.home

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check user's membership to redirect appropriately
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: membership } = await supabase
                    .from('tenant_memberships')
                    .select('role, tenants(slug)')
                    .eq('user_id', user.id)
                    .eq('active', true)
                    .limit(1)
                    .single()

                if (membership && membership.tenants) {
                    const slug = (membership.tenants as any).slug
                    const tenantRoutes = ROUTES.tenant(slug)
                    const dashboardPath = ['owner', 'admin', 'trainer'].includes(membership.role)
                        ? tenantRoutes.admin.dashboard
                        : tenantRoutes.employee.dashboard
                    return NextResponse.redirect(`${SITE_URL}${dashboardPath}`)
                }

                // No membership - redirect to setup
                return NextResponse.redirect(`${SITE_URL}${ROUTES.setup}`)
            }
        }
    }

    // Login failed or something went wrong, redirect to error page or login
    return NextResponse.redirect(`${SITE_URL}${ROUTES.login}?error=Unable to verify authentication`)
}
