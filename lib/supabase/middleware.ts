import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/lib/config/routes'

export async function updateSession(request: NextRequest) {
    // CRITICAL: Validate environment variables before proceeding
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[Middleware] Missing Supabase environment variables')
        // Return next response to avoid blocking the request
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Do not run code between createServerClient and
        // supabase.auth.getUser(). A simple mistake could make it very hard to debug
        // issues with users being randomly logged out.

        const {
            data: { user },
        } = await supabase.auth.getUser()

        const path = request.nextUrl.pathname;

        // 0. Forced Password Reset Check
        if (user && user.user_metadata?.force_password_reset && path !== ROUTES.updatePassword && !path.startsWith(ROUTES.auth.signout)) {
            const url = request.nextUrl.clone()
            url.pathname = ROUTES.updatePassword
            return NextResponse.redirect(url)
        }

        // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
        // creating a new Response object with NextResponse.redirect() usage, the
        // cookies set in the supabase client above will be lost.
        return supabaseResponse
    } catch (error) {
        console.error('[Middleware] Error in updateSession:', error)
        // Return next response to avoid blocking the request on error
        return NextResponse.next({ request })
    }
}
