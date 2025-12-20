'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate form data
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const validated = authSchema.safeParse({ email, password })

    if (!validated.success) {
        return { error: "Invalid email or password format." }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check if user has any tenant memberships
    const { data: membership } = await supabase
        .from('tenant_memberships')
        .select('tenant:tenants(slug)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('active', true)
        .limit(1)
        .single()

    revalidatePath('/', 'layout')

    // If no membership, redirect to setup
    if (!membership || !membership.tenant) {
        redirect('/setup')
    }

    // Redirect to their tenant admin
    redirect(`/t/${(membership.tenant as any).slug}/admin`)
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!fullName) {
        return { error: "Full Name is required." }
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName
            }
        }
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/setup')
}
