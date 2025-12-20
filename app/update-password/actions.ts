'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export async function updatePassword(prevState: any, formData: FormData) {
    const raw = {
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    }

    const valid = passwordSchema.safeParse(raw)
    if (!valid.success) {
        return { error: valid.error.issues[0].message }
    }

    const { password } = valid.data
    const supabase = await createClient()

    // 1. Update user password
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }

    // 2. Remove force_password_reset flag using admin client
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const adminClient = createServiceRoleClient()
        // We need to fetch current metadata first to preserve other fields? 
        // updateUserById merges metadata by default, but let's be safe.
        // Actually, Supabase merges top-level keys in user_metadata.
        await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                force_password_reset: false
            }
        })
    }

    redirect('/')
}
