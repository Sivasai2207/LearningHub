import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

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
                    const dashboardPath = ['owner', 'admin', 'trainer'].includes(membership.role)
                        ? `/t/${slug}/admin`
                        : `/t/${slug}/employee`
                    return NextResponse.redirect(`${origin}${dashboardPath}`)
                }

                // No membership - redirect to setup
                return NextResponse.redirect(`${origin}/setup`)
            }
        }
    }

    // Login failed or something went wrong, redirect to error page or login
    return NextResponse.redirect(`${origin}/login?error=Unable to verify authentication`)
}
