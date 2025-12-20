'use server'

import { createServiceRoleClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/admin/audit'

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const email = formData.get('email') as string

    if (!email) {
        return { error: "Email is required" }
    }

    const adminClient = createServiceRoleClient()

    // 1. Find user profile to check role
    // We check tenancy memberships to see if they are an admin in ANY tenant?
    // Or just check if they are a platform admin (global)? 
    // The requirement says "if the user role is admin... send reset link". 
    // I'll check if they have 'owner' or 'admin' role in ANY tenant membership.

    // First get the user ID from email
    const { data: { users }, error: userError } = await adminClient.auth.admin.listUsers() // Limit? listUsers defaults to 50. 
    // Better to use profiles table if mapped.

    const { data: profile } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single()

    if (!profile) {
        // Return generic success to prevent enumeration? 
        // User asked for specific message "request has been raised". 
        // If email not found, maybe just say "If account exists..."
        return { message: "If an account exists with this email, a request has been raised." }
    }

    // Check roles in memberships
    const { data: memberships } = await adminClient
        .from('tenant_memberships')
        .select('role, tenant_id')
        .eq('user_id', profile.id)

    const isAdmin = memberships?.some(m => ['owner', 'admin'].includes(m.role))

    if (isAdmin) {
        // Send actual reset link
        const { error } = await adminClient.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
            }
        })

        if (error) {
            console.error("Reset link error:", error)
            return { error: "Failed to send reset link" }
        }

        return { success: true, message: "Password reset link sent to your email." }

    } else {
        // Employee: Log request (Audit log or notification)
        // User said "request has been raised"

        // Log it so admins can see it in Audit Logs
        // We need a tenant ID for audit log usually. We'll pick the first one or null if allowed.
        // Audit log requires tenant_id usually.
        const tenantId = memberships?.[0]?.tenant_id

        if (tenantId) {
            await logAudit({
                action: 'USER_UPDATE', // Or specific REQUEST_RESET type? Using USER_UPDATE for now or create new type.
                entityType: 'user',
                entityId: profile.id,
                metadata: {
                    type: 'PASSWORD_RESET_REQUEST',
                    email: email,
                    message: "User requested password reset via Forgot Password screen"
                }
            })
        }

        return { success: true, message: "Request has been raised. Please contact your administrator to reset your password." }
    }
}
